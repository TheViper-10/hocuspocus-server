const { Server } = require("@hocuspocus/server");

// Configure the server
const port = process.env.PORT || 1234;
const server = Server.configure({
  port,
  // No authentication or persistence yet
  async onConnect() {
    console.log("🔌 New connection");
  },
  async onDisconnect() {
    console.log("👋 Connection closed");
  },
  async onChange(data) {
    console.log("--------------------------------");
    console.log("data received:", data);
    console.log("--------------------------------\n");
  },
});

// Start the server
server.listen();
