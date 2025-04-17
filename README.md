# Hocuspocus Server

This project is a real-time collaboration server using [Hocuspocus](https://github.com/ueberdosis/hocuspocus). It lets people work together on shared documents, like Google Docs, but you can host it yourself.

The server is live at: [https://hocuspocus-server-547v.onrender.com](https://hocuspocus-server-547v.onrender.com)

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)

### Installation

1. Clone this repository:

   ```bash
   git clone <your-repo-url>
   cd hocuspocus-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Server

Start the server with:

```bash
node server.js
```

or

```bash
npm install
```

By default, it runs on port `1234`. You can set a different port with the `PORT` environment variable.

### Example

When someone connects or makes changes, you'll see logs in your terminal.

## Deployment

This server is deployed using [Render](https://render.com/). Render automatically installs dependencies and runs the server.

## Dependencies

- [`@hocuspocus/server`](https://www.npmjs.com/package/@hocuspocus/server)
- [`yjs`](https://www.npmjs.com/package/yjs)
- [`y-protocols`](https://www.npmjs.com/package/y-protocols)

## License

MIT

---

> Visit the live server: [https://hocuspocus-server-547v.onrender.com](https://hocuspocus-server-547v.onrender.com)
