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
    console.log("--------------------------------");
    console.log(`✍️ Document ${data.documentName} changed`);
    console.log("data received:", JSON.stringify(data, null, 2));
    console.log("--------------------------------\n");
  },
});

// Start the server
server.listen();
