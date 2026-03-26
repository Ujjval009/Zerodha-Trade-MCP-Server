import { executeTrade, prepareTrade } from "./trade";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0"
});

const serverStartedAt = Date.now();

// Add an addition tool
server.registerTool("add-two-numbers",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

server.registerTool(
  "ping",
  {
    title: "Ping",
    description: "Liveness check. Returns `pong`.",
    inputSchema: z.object({}),
  },
  async () => ({
    content: [{ type: "text", text: "pong" }],
  })
);

server.registerTool(
  "health",
  {
    title: "Health",
    description: "Returns basic liveness information about the MCP server.",
    inputSchema: z.object({}),
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            ok: true,
            uptimeMs: Date.now() - serverStartedAt,
          },
          null,
          2
        ),
      },
    ],
  })
);

server.registerTool("factorial-of-a-number",
  {
    title: "Factorial Tool",
    description: "Calculate the factorial of a number",
    inputSchema: { a: z.number() }
  },
  async ({ a }) => {
    let ans = 1;
    for(let i = 2; i <= a; i++) {
      ans *= i;
    }
    return {
      content: [{ type: "text", text: String(ans) }]
    }
  }
);

const sideSchema = z.enum(["BUY", "SELL"]);
const tradeInputSchema = z.object({
  side: sideSchema,
  symbol: z.string().min(1).max(30),
  quantity: z.number().int().positive().max(1000000),
});

server.registerTool(
  "prepare-trade",
  {
    title: "Prepare Trade",
    description:
      "Creates a trade preview/plan. Claude must ask you for permission and only then call execute-trade.",
    inputSchema: tradeInputSchema,
  },
  async ({ side, symbol, quantity }) => {
    const plan = await prepareTrade({ side, symbol, quantity });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: "permission_required",
              plan,
              instruction:
                "After you approve, Claude should call execute-trade with the exact same inputs.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.registerTool(
  "execute-trade",
  {
    title: "Execute Trade",
    description:
      "Executes the trade on the broker. Use only after you have explicitly approved the prepare-trade output.",
    inputSchema: tradeInputSchema,
  },
  async ({ side, symbol, quantity }) => {
    const result = await executeTrade({ side, symbol, quantity });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

server.registerTool("buy-stock",
  {
    title: "Buy Stock Tool",
    description:
      "Preview-only: prepares a BUY trade plan. Claude must ask you for permission, then call execute-trade.",
    inputSchema: { symbol: z.string().min(1).max(30), quantity: z.number().int().positive().max(1000000) }
  },
  async ({ symbol, quantity }) => {
    const plan = await prepareTrade({ side: "BUY", symbol, quantity });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: "permission_required",
              plan,
              instruction:
                "After you approve, Claude should call execute-trade with side=BUY and the same symbol/quantity.",
            },
            null,
            2
          ),
        },
      ],
    }
  }
);

server.registerTool("sell-stock",
  {
    title: "sell Stock Tool",
    description:
      "Preview-only: prepares a SELL trade plan. Claude must ask you for permission, then call execute-trade.",
    inputSchema: { symbol: z.string().min(1).max(30), quantity: z.number().int().positive().max(1000000) }
  },
  async ({ symbol, quantity }) => {
    const plan = await prepareTrade({ side: "SELL", symbol, quantity });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: "permission_required",
              plan,
              instruction:
                "After you approve, Claude should call execute-trade with side=SELL and the same symbol/quantity.",
            },
            null,
            2
          ),
        },
      ],
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);