const DEFAULT_ENDPOINT = "https://api.hardcover.app/v1/graphql";

export interface HardcoverConfig {
  apiToken: string;
  endpoint: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): HardcoverConfig {
  const apiToken = env.HARDCOVER_API_TOKEN?.trim();

  if (!apiToken) {
    throw new Error("HARDCOVER_API_TOKEN is required.");
  }

  return {
    apiToken,
    endpoint: env.HARDCOVER_API_URL?.trim() || DEFAULT_ENDPOINT,
  };
}
