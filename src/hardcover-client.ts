import { HardcoverConfig } from "./config.js";

interface GraphQlResponse<TData> {
  data?: TData;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
}

export class HardcoverApiError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HardcoverApiError";
  }
}

export class HardcoverClient {
  constructor(private readonly config: HardcoverConfig) {}

  async query<TData>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<TData> {
    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        Authorization: this.config.apiToken,
        "Content-Type": "application/json",
        "User-Agent": "hardcover-mcp/0.1.0",
      },
      body: JSON.stringify({ query, variables }),
    });

    const payload = (await response.json()) as GraphQlResponse<TData>;

    if (!response.ok) {
      throw new HardcoverApiError(
        `Hardcover API request failed with status ${response.status}.`,
        payload,
      );
    }

    if (payload.errors?.length) {
      const message = payload.errors.map((error) => error.message).join("; ");
      throw new HardcoverApiError(message, payload.errors);
    }

    if (!payload.data) {
      throw new HardcoverApiError("Hardcover API returned no data.", payload);
    }

    return payload.data;
  }
}
