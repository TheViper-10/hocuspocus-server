const { Server } = require("@hocuspocus/server");

// Configure the server
const server = Server.configure({
  port: 1234,
  // No authentication or persistence yet
  async onConnect() {
    console.log("🔌 New connection");
  },
  async onDisconnect() {
    console.log("👋 Connection closed");
  },
  async onChange(data) {
    console.log(`✍️ Document ${data.documentName} changed`);
  },
});

// Start the server
server.listen();

console.log("🚀 Hocuspocus server started on ws://127.0.0.1:1234");
