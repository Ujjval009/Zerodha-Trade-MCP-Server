# Zerodha Trade MCP Server

A Model Context Protocol (MCP) server written in **TypeScript** that integrates with Zerodha (Kite API) to enable programmatic trading, data access, and intelligent automation using Claude (or any other MCP-compatible LLMs).

---

## 📌 Overview

This project implements an MCP-compatible server that acts as a bridge between:
* Zerodha Kite APIs (trading + market data)
* Claude / AI agents
* External tools or automation workflows

It allows Claude to naturally place trades and fetch market data directly from your Zerodha account using simple conversations.

---

## 🏗️ Project Structure

```
Zerodha-Trade-MCP-Server/
│
├── index.ts             # Entry point for MCP server
├── trade.ts             # Trading logic, AMO fallback, and Kite API wrappers
├── get_token.ts         # Utility script to generate a new Access Token
├── package.json         # Node.js dependencies
├── tsconfig.json        # TypeScript configuration
├── .env                 # API keys and Tokens (not committed)
└── README.md
```

> **Note:** This is a **TypeScript/Node.js** project, NOT a Python project. You do not need a `requirements.txt` or a `venv`. All dependencies are managed via `package.json`.

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Ujjval009/Zerodha-Trade-MCP-Server.git
cd Zerodha-Trade-MCP-Server
```

### 2. Install Dependencies
This project primarily uses Node.js. Make sure you have Node.js installed, then run the standard installation:
```bash
npm install
```

*(Optional)* If you are tying this into Python environments or need equivalent Python packages, you can install the dependencies listed in the requirements file:
```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables
Create a file named `.env` in the root directory and add your Zerodha API credentials:

```env
KITE_API_KEY=your_api_key
KITE_API_SECRET=your_api_secret
KITE_ACCESS_TOKEN=your_access_token
```

### 4. How to Generate an Access Token (Daily)
Zerodha Kite Access Tokens expire daily. To generate a new one:

1. Visit this URL in your browser: 
   `https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY`
2. Log in. Once redirected, look at the URL in your browser's address bar.
3. Copy the `request_token` value from the URL.
4. Open `get_token.ts`, paste your `REQUEST_TOKEN` on line 5.
5. Run the script immediately:
   ```bash
   npx tsx get_token.ts
   ```
6. Paste the resulting Access Token into your `.env` file as `KITE_ACCESS_TOKEN`.

### 5. Whitelist Your IP Address (Critical Step)
Zerodha strictly blocks API trades from unknown IP addresses. 
1. Get your computer's public IP address (IPv4 and IPv6).
2. Go to your [Kite Developer Console](https://developers.kite.trade/).
3. Click on **Profile** in the top navigation bar.
4. Add your IP addresses (up to 2 allowed, e.g., your IPv4 and IPv6) to the **IP Whitelist** box.
5. Save the profile.

---

## ⚙️ Connecting to Claude Desktop

To allow Claude to use this server, edit your Claude Desktop configuration file.
On Linux, this is located at `~/.config/Claude/claude_desktop_config.json`.

Add the following to your `mcpServers` object:

```json
"mcpServers": {
  "zerodha-trade": {
    "command": "npx",
    "args": [
      "tsx",
      "/absolute/path/to/Zerodha-Trade-MCP-Server/index.ts"
    ],
    "cwd": "/absolute/path/to/Zerodha-Trade-MCP-Server"
  }
}
```

**Restart Claude Desktop** completely for the changes (and any new `.env` variables) to take effect!

---

## 🧠 Smart Trade Execution

The server uses a smart execution strategy (`trade.ts`) when you place an order:
1. It first attempts to place a **MARKET** order.
2. If the Indian stock market (NSE/BSE) is closed (Weekends or outside 9:15 AM - 3:30 PM), the order will fail.
3. Claude and the MCP server can recognize this and offer to place an **AMO (After Market Order)** limit order instead!

---

## ⚠️ Important Disclaimers

* This project is for **educational and automation testing purposes**.
* Algorithmic and programmatic trading involves significant financial risk.
* **DO NOT** commit your `.env` file to GitHub or expose your API keys publicly.
* The authors are not responsible for any financial losses incurred while using this code.
