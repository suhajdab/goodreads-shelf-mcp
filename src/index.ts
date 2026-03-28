import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";

const userId = process.env.GOODREADS_USER_ID;
const key = process.env.GOODREADS_KEY;
const shelf = process.env.GOODREADS_SHELF ?? "%23ALL%23";

if (!userId || !key) {
  process.stderr.write(
    "Error: GOODREADS_USER_ID and GOODREADS_KEY environment variables are required.\n"
  );
  process.exit(1);
}

const server = new McpServer({
  name: "goodreads-shelf",
  version: "1.0.0",
});

registerTools(server, userId, key, shelf);

const transport = new StdioServerTransport();
await server.connect(transport);
