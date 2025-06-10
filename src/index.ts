/**
 * Main entry point for the Hocuspocus server
 */
import { createServer } from "./server";

// This allows running the server directly with 'node dist/index.js'
if (require.main === module) {
  const server = createServer();

  console.log(
    `Hocuspocus server listening on port ${server.configuration.port}`
  );
  server.listen();
}
