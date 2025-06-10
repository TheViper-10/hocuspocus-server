/**
 * Contracts layer for DevRev SDK
 *
 * This abstraction layer allows us to:
 * 1. Decouple our application from specific SDK versions
 * 2. Easily swap between internal/public SDKs
 * 3. Control what parts of the SDK are exposed to our application
 * 4. Add custom types or wrappers if needed
 */

// Re-export the main client
export { client } from '@devrev/typescript-sdk-internal';

// Re-export all types and interfaces we need
export {
  AuthTokenRequestedTokenType,
  ArtifactConfigurationSet,
  StagedContentStatus,
} from '@devrev/typescript-sdk-internal/dist/auto-generated/internal/private-internal-devrev-sdk';

// If you need to add custom types or extend the SDK types, do it here
// Example:
// export interface CustomDevRevConfig {
//   endpoint: string;
//   timeout?: number;
// }
