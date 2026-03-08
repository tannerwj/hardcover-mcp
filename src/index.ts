#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import { HardcoverClient } from "./hardcover-client.js";
import { registerHardcoverTools } from "./tools.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new HardcoverClient(config);

  const server = new McpServer({
    name: "hardcover-mcp",
    version: "0.1.0",
  });

  registerHardcoverTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("hardcover-mcp running on stdio");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
