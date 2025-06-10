import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { client, AuthTokenRequestedTokenType, ArtifactConfigurationSet, StagedContentStatus } from '../contracts';
import { getActiveConfig } from '../config/environments';
import { DEVREV_FILE_TYPE_DRDFV2 } from '../config/constants';
import { yjsConverters } from '../lib/converter-strategy';

/**
 * Initialize and configure the Hocuspocus server
 */
export function createServer(): Server {
  // Get environment-specific configuration
  const envConfig = getActiveConfig();

  // Get the DRDFV2 converter (strategy pattern)
  const converter = yjsConverters.getConverter('drdfv2');

  // Create and return configured server
  return new Server({
    port: envConfig.port,
    debounce: 5000, // 5 seconds
    maxDebounce: 20000, // 20 seconds

    extensions: [new Logger({})],

    // When user connects - primarily for logging or initial setup if needed
    onConnect: async ({ documentName: artifactId, socketId }) => {
      // console.log(`Client with socket ID ${socketId} connected to document ${artifactId}`);
    },

    // Authenticates the user by validating the JWT token and generating a DevRev PAT
    onAuthenticate: async ({ token, documentName: artifactId, socketId }) => {
      if (!token) {
        console.error(`Authentication failed for socket ${socketId} on document ${artifactId}: No JWT token provided.`);
        throw new Error('Authentication token is missing.'); // This will reject the connection
      }

      // Create SDK instance with JWT token for authentication
      const jwtSDKInstance = client.setupInternal({
        endpoint: envConfig.devrevEndpoint,
        token: token,
      });

      try {
        // Generate a DevRev PAT from the JWT token
        const tokenResponse = await jwtSDKInstance.authTokensCreate({
          expires_in: 7,
          requested_token_type: AuthTokenRequestedTokenType.UrnDevrevParamsOauthTokenTypePat,
        });

        // Create SDK instance with PAT token for subsequent operations
        const patSDKInstance = client.setupInternal({
          endpoint: envConfig.devrevEndpoint,
          token: tokenResponse.data.access_token,
        });

        // console.log(`Authenticated socket ${socketId} for document ${artifactId} with provided token.`);
        // Return SDK instance configured with PAT token
        return {
          devrevSDKInstance: patSDKInstance,
        };
      } catch (error) {
        throw new Error(`Authentication failed for socket ${socketId} on document ${artifactId}: ${error}`);
      }
    },

    // Deletes the DevRev PAT when the user disconnects
    onDisconnect: async ({ context, documentName: artifactId, socketId }) => {
      // Access SDK instance from context
      const { devrevSDKInstance } = context;
      if (devrevSDKInstance) {
        try {
          await devrevSDKInstance.authTokensDelete({});
        } catch (error) {
          console.error(`Error deleting token for socket ${socketId} on document ${artifactId}: ${error}`);
        }
      } else {
        console.warn(`No SDK instance found for socket ${socketId} on document ${artifactId}`);
      }
    },

    // Fetches and loads the document (artifact) requested from DevRev SOR
    onLoadDocument: async ({ context, documentName: artifactId, socketId }) => {
      const { devrevSDKInstance } = context;
      if (!devrevSDKInstance) {
        throw new Error(
          `Cannot load document ${artifactId}: Missing SDK instance in authentication context for operation by ${socketId}.`,
        );
      }

      try {
        // Use the artifactsDownload endpoint
        // Note: HTTP clients automatically follow the 303 redirect, so we get the final content directly
        const downloadResponse = await devrevSDKInstance.artifactsDownload({
          id: artifactId,
        });

        // Check if we got the file content successfully (after automatic redirect following)
        if (downloadResponse.status !== 200 || !downloadResponse.data) {
          throw new Error(`Failed to download document ${artifactId}: status ${downloadResponse.status}`);
        }

        // The SDK returns the JSON object directly in downloadResponse.data
        const devRevDocumentContent = downloadResponse.data;

        // Convert artifact to YJS document using strategy pattern
        const loadedDoc = converter.toYjs(devRevDocumentContent);

        // console.log(`Document ${artifactId} loaded successfully for socket ${socketId}`);
        return loadedDoc;
      } catch (error) {
        throw new Error(`Error loading document ${artifactId} for socket ${socketId}: ${error}`);
      }
    },

    // Stores the document in DevRev SOR by creating a new artifact version from the staged content
    onStoreDocument: async ({ context, documentName: artifactId, document, socketId }) => {
      const { devrevSDKInstance } = context;

      if (!devrevSDKInstance) {
        throw new Error(
          `Cannot store document ${artifactId}: Missing SDK instance in authentication context for operation by ${socketId}.`,
        );
      }

      console.log('=== DEBUG: YJS Document Analysis ===');
      console.log('Document exists:', !!document);
      console.log('Document clientID:', document.clientID);
      console.log('Root map size:', document.getMap().size);
      console.log('Root map keys:', Array.from(document.getMap().keys()));
      console.log('Root map as JSON:', document.getMap().toJSON());
      console.log('Full document state:', document.toJSON());
      console.log('=====================================');

      let stagedContentId: string | undefined;

      try {
        // Step 1: Prepare staged content
        let response;
        try {
          response = await devrevSDKInstance.artifactsContentsPrepare({
            file_type: DEVREV_FILE_TYPE_DRDFV2,
            configuration_set: ArtifactConfigurationSet.Default,
          });
        } catch (error) {
          throw new Error(`Failed to prepare staged content for ${artifactId}: ${error}`);
        }

        const uploadUrl = response.data.url;
        const formData = response.data.form_data;
        stagedContentId = response.data.staged_content?.id;
        if (!stagedContentId) {
          throw new Error(`No staged content ID returned for ${artifactId}`);
        }

        // Step 2: Convert YJS document to artifact format using strategy pattern
        const devRevDocumentContent = converter.fromYjs(document);

        const formDataToUpload = new FormData();
        for (const field of formData) {
          formDataToUpload.append(field.key, field.value);
        }
        // Pass the JSON object directly to Blob - it will handle serialization
        formDataToUpload.append(
          'file',
          new Blob([JSON.stringify(devRevDocumentContent)], { type: 'application/json' }),
          'document.json',
        );

        let uploadResponse;
        try {
          uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formDataToUpload,
          });
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
          }
        } catch (error) {
          throw new Error(`Failed to upload document content for ${artifactId}: ${error}`);
        }

        // console.log(`Document ${artifactId} uploaded successfully as JSON. Status: ${uploadResponse.status}`);

        // Step 3: Validate the staged content
        let validateResponse;
        try {
          validateResponse = await devrevSDKInstance.artifactsContentsValidate({
            id: stagedContentId,
          });
        } catch (error) {
          throw new Error(`Failed to validate staged content ${stagedContentId} for ${artifactId}: ${error}`);
        }

        if (validateResponse.data.staged_content?.status !== StagedContentStatus.Succeeded) {
          throw new Error(
            `Staged content ${stagedContentId} validation failed for ${artifactId}: ${validateResponse.data.staged_content?.error}`,
          );
        }

        // Step 4: Create artifact version from staged content
        try {
          const createArtifactVersionResponse = await devrevSDKInstance.artifactsVersionsCreateFromContent({
            id: artifactId,
            staged_content_id: stagedContentId,
          });

          // console.log(
          //   `Artifact version ${createArtifactVersionResponse.data.artifact_version.version} created from staged content ${stagedContentId} for document ${artifactId}`,
          // );
        } catch (error) {
          throw new Error(`Failed to create artifact version for ${artifactId}: ${error}`);
        }
      } catch (error) {
        throw new Error(`Error storing document ${artifactId} for socket ${socketId}: ${error}`);
      }
    },
  });
}
