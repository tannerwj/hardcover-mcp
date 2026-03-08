import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const serverPath = path.join(repoRoot, "dist", "index.js");

const expectedTools = [
  "hardcover_search",
  "hardcover_get_book",
  "hardcover_get_author",
  "hardcover_get_edition",
  "hardcover_get_user",
  "hardcover_get_publisher",
  "hardcover_get_character",
  "hardcover_get_series",
  "hardcover_get_activity_feed",
  "hardcover_get_user_library",
  "hardcover_get_list",
  "hardcover_get_prompt",
  "hardcover_create_prompt",
  "hardcover_update_prompt",
  "hardcover_delete_prompt",
  "hardcover_follow_prompt",
  "hardcover_unfollow_prompt",
  "hardcover_add_prompt_answer",
  "hardcover_update_prompt_answer",
  "hardcover_delete_prompt_answer",
  "hardcover_create_list",
  "hardcover_update_list",
  "hardcover_delete_list",
  "hardcover_add_book_to_list",
  "hardcover_update_list_book",
  "hardcover_remove_book_from_list",
  "hardcover_follow_list",
  "hardcover_unfollow_list",
  "hardcover_set_user_book",
  "hardcover_delete_user_book",
  "hardcover_add_user_book_read",
  "hardcover_update_user_book_read",
  "hardcover_delete_user_book_read",
];

const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath],
  cwd: repoRoot,
  env: {
    ...process.env,
    HARDCOVER_API_TOKEN: process.env.HARDCOVER_API_TOKEN || "smoke-test-token",
    HARDCOVER_API_URL:
      process.env.HARDCOVER_API_URL || "https://api.hardcover.app/v1/graphql",
  },
  stderr: "pipe",
});

if (transport.stderr) {
  transport.stderr.on("data", (chunk) => {
    process.stderr.write(String(chunk));
  });
}

const client = new Client({
  name: "hardcover-mcp-smoke-tools",
  version: "0.1.0",
});

try {
  await client.connect(transport);
  const result = await client.listTools();
  const actualTools = result.tools.map((tool) => tool.name);
  const missing = expectedTools.filter((tool) => !actualTools.includes(tool));

  if (missing.length > 0) {
    throw new Error(`Missing expected tools: ${missing.join(", ")}`);
  }

  console.log(
    JSON.stringify(
      {
        expected: expectedTools.length,
        registered: actualTools.length,
      },
      null,
      2,
    ),
  );
} finally {
  await transport.close();
}
