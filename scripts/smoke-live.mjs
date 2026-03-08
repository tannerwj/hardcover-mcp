import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const serverPath = path.join(repoRoot, "dist", "index.js");
const localConfigPath = path.join(repoRoot, "mcp-client.config.json");

function loadLocalConfigEnv() {
  if (!fs.existsSync(localConfigPath)) {
    return {};
  }

  const parsed = JSON.parse(fs.readFileSync(localConfigPath, "utf8"));
  return parsed?.mcpServers?.hardcover?.env ?? {};
}

const localConfigEnv = loadLocalConfigEnv();
const runtimeEnv = {
  ...process.env,
  ...localConfigEnv,
};

if (!runtimeEnv.HARDCOVER_API_TOKEN) {
  throw new Error("HARDCOVER_API_TOKEN is required for npm run smoke:live");
}

const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath],
  cwd: repoRoot,
  env: runtimeEnv,
  stderr: "pipe",
});

if (transport.stderr) {
  transport.stderr.on("data", (chunk) => {
    process.stderr.write(String(chunk));
  });
}

const client = new Client({
  name: "hardcover-mcp-smoke-live",
  version: "0.1.0",
});

function pickData(result) {
  return result?.structuredContent?.data ?? null;
}

try {
  await client.connect(transport);

  const search = pickData(
    await client.callTool({
      name: "hardcover_search",
      arguments: {
        query: "The Hobbit",
        type: "books",
        limit: 1,
      },
    }),
  );

  const me = pickData(
    await client.callTool({
      name: "hardcover_get_user",
      arguments: {
        me: true,
      },
    }),
  );

  const series = pickData(
    await client.callTool({
      name: "hardcover_get_series",
      arguments: {
        slug: "the-lord-of-the-rings",
        booksLimit: 1,
      },
    }),
  );

  const activity = pickData(
    await client.callTool({
      name: "hardcover_get_activity_feed",
      arguments: {
        feed: "for_you",
        limit: 1,
      },
    }),
  );

  console.log(
    JSON.stringify(
      {
        searchFirstResult: search?.items?.[0]?.title ?? null,
        me: {
          id: me?.id ?? null,
          username: me?.username ?? null,
        },
        series: {
          id: series?.id ?? null,
          slug: series?.slug ?? null,
        },
        activityCount: Array.isArray(activity?.activities)
          ? activity.activities.length
          : 0,
      },
      null,
      2,
    ),
  );
} finally {
  await transport.close();
}
