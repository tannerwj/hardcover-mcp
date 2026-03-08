# hardcover-mcp

MCP server for the [Hardcover GraphQL API](https://docs.hardcover.app/api/getting-started/).

## Features

- Read access for books, authors, editions, users, publishers, characters, series, prompts, lists, user libraries, and activity feeds
- Write access for lists, prompts, prompt answers, user-library entries, and read-history records
- Structured outputs designed for MCP clients instead of raw GraphQL payloads
- One activity tool that supports `for_you`, `global`, and user-specific modes

## Tools

### Read tools

- `hardcover_search`
- `hardcover_get_book`
- `hardcover_get_author`
- `hardcover_get_edition`
- `hardcover_get_user`
- `hardcover_get_publisher`
- `hardcover_get_character`
- `hardcover_get_series`
- `hardcover_get_activity_feed`
- `hardcover_get_user_library`
- `hardcover_get_list`
- `hardcover_get_prompt`

### Write tools

- `hardcover_create_list`
- `hardcover_update_list`
- `hardcover_delete_list`
- `hardcover_add_book_to_list`
- `hardcover_update_list_book`
- `hardcover_remove_book_from_list`
- `hardcover_follow_list`
- `hardcover_unfollow_list`
- `hardcover_set_user_book`
- `hardcover_delete_user_book`
- `hardcover_add_user_book_read`
- `hardcover_update_user_book_read`
- `hardcover_delete_user_book_read`
- `hardcover_create_prompt`
- `hardcover_update_prompt`
- `hardcover_delete_prompt`
- `hardcover_follow_prompt`
- `hardcover_unfollow_prompt`
- `hardcover_add_prompt_answer`
- `hardcover_update_prompt_answer`
- `hardcover_delete_prompt_answer`

The current surface mixes read tools with focused write tools for lists, user-library records, and prompts.
`hardcover_search` returns normalized summaries per entity type instead of the raw search payload.
`hardcover_get_activity_feed` supports `for_you`, `global`, and user-specific activity in one tool.

## Requirements

- Node.js 22+
- A Hardcover API token from [hardcover.app/account/api](https://hardcover.app/account/api)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set your Hardcover token:

   ```bash
   HARDCOVER_API_TOKEN="Bearer <token from hardcover.app/account/api>"
   ```

   Use the token value exactly as Hardcover shows it on [hardcover.app/account/api](https://hardcover.app/account/api). The server forwards that value directly in the `Authorization` header.

3. Build the server:

   ```bash
   npm run build
   ```

## Run locally

```bash
npm start
```

## Validate locally

Run the offline smoke test to verify the built server starts and registers the expected tools:

```bash
npm run check
```

Run the live smoke test to hit the real Hardcover API with read-only calls:

```bash
HARDCOVER_API_TOKEN="Bearer <token from hardcover.app/account/api>" npm run smoke:live
```

## Example MCP client config

```json
{
  "mcpServers": {
    "hardcover": {
      "command": "node",
      "args": ["/absolute/path/to/hardcover-mcp/dist/index.js"],
      "env": {
        "HARDCOVER_API_TOKEN": "Bearer <token from hardcover.app/account/api>"
      }
    }
  }
}
```

## Notes

- Default endpoint: `https://api.hardcover.app/v1/graphql`
- Override the endpoint with `HARDCOVER_API_URL`
- Hardcover documents a 60 requests/minute rate limit and a maximum query depth of 3
- CI runs `npm run check` on pushes to `master` and on pull requests
- List privacy values in the MCP tools are `public`, `followers_only`, and `private`
