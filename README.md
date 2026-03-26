# zerodha-trade

To install dependencies:

```bash
bun install
```

## Run

Set Kite credentials (recommended) then start the MCP server.

### Environment variables

`KITE_API_KEY`: your Kite Connect API key

`KITE_ACCESS_TOKEN`: your current Kite access token (expires periodically)

### Example (PowerShell)

```powershell
$env:KITE_API_KEY="YOUR_API_KEY"
$env:KITE_ACCESS_TOKEN="YOUR_ACCESS_TOKEN"
bun index.ts
```

### Example (Bun)

```bash
bun index.ts
```

## MCP Tools

This server exposes tools to Claude via Model Context Protocol (MCP).

### Liveness

`ping`: returns `pong`

`health`: returns basic liveness info (including uptime)

### Trading (permission-first flow)

To avoid accidental execution, the intended workflow is:

1. Claude calls `prepare-trade` (or uses `buy-stock` / `sell-stock` which are preview-only)
2. Claude asks you for approval and only after you say yes
3. Claude calls `execute-trade` with the exact same inputs

What `execute-trade` does:

1. Tries a normal `MARKET` order first (`regular` variety)
2. If Kite rejects with hint `switch_to_amo`, it retries as an AMO `LIMIT` order using an estimated limit price derived from `kc.getQuote()`

## Production hardening (optional)

For stronger safety than “Claude asks permission”, consider adding an enforced confirmation token/flag that `execute-trade` requires. (Not enabled by default in this version.)

This project was created using `bun init` in bun v1.3.10. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
