# @pipeworx/tldr-pages

[tldr-pages](https://tldr.sh) MCP — community maintained simplified man pages. Keyless. Cached 24h in-pack.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `page(command, platform?, language?)` — render tldr page for a command
- `commands(platform?, language?)` — list commands available for a platform
- `platforms()` — list supported platforms
- `search(query, platform?, language?, limit?)` — substring search across page titles

`platform`: `common` (default) | `linux` | `osx` | `windows` | `android` | `sunos` | `freebsd`.
`language`: ISO 639-1, default `en`.

## Data source

`https://raw.githubusercontent.com/tldr-pages/tldr/main/pages...`

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "tldr-pages": {
      "url": "https://gateway.pipeworx.io/tldr-pages/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Tldr Pages data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
