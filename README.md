# Zerodha Trade MCP Server

A Model Context Protocol (MCP) server that integrates with Zerodha (Kite API) to enable programmatic trading, data access, and intelligent automation using LLMs or external agents.

---

## 📌 Overview

This project implements an MCP-compatible server that acts as a bridge between:

* Zerodha Kite APIs (trading + market data)
* AI agents / LLMs
* External tools or automation workflows

It allows structured, tool-based interaction with trading functions like:

* Fetching market data
* Placing orders
* Managing positions
* Automating trading workflows

---

## ⚙️ Features

* 🔌 MCP-compliant server architecture
* 📈 Zerodha Kite API integration
* 🤖 Tool-ready endpoints for LLM agents
* 🔐 Secure API handling using environment variables
* ⚡ Async-ready design (if applicable)
* 🧩 Extensible tool system (add custom trading tools easily)

---

## 🏗️ Project Structure

```
Zerodha-Trade-MCP-Server/
│
├── main.py              # Entry point for MCP server
├── tools/               # MCP tools (trading, data fetching, etc.)
├── services/            # Zerodha API interaction layer
├── config/              # Configuration files
├── .env                 # API keys (not committed)
├── requirements.txt     # Dependencies
└── README.md
```

---

## 🧠 How It Works

### Intuition

This server acts like a **translator between AI and trading APIs**.

Instead of manually coding trading logic, an AI agent can:
→ call tools
→ tools hit Zerodha API
→ response is returned in structured format

---

### Internal Working

1. MCP server exposes tools
2. Each tool maps to a function (e.g., place order)
3. Function calls Zerodha Kite API
4. Response is formatted and returned to the agent

---

### Real-World Usage

* AI trading assistants
* Automated portfolio managers
* Backtesting + execution pipelines
* Chat-based trading systems

---

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Ujjval009/Zerodha-Trade-MCP-Server.git
cd Zerodha-Trade-MCP-Server
```

---

### 2. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate   # Linux/Mac
# OR
venv\Scripts\activate      # Windows
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Setup Environment Variables

Create a `.env` file:

```env
KITE_API_KEY=your_api_key
KITE_API_SECRET=your_api_secret
ACCESS_TOKEN=your_access_token
```

---

## ▶️ Running the Server

```bash
python main.py
```

---

## 🔧 Available Tools (Example)

| Tool Name     | Description             |
| ------------- | ----------------------- |
| get_quote     | Fetch live market data  |
| place_order   | Execute buy/sell orders |
| get_positions | View current holdings   |
| get_balance   | Fetch account balance   |

---

## 🧩 Adding New Tools

1. Create a new function inside `/tools`
2. Define input schema
3. Register it in MCP server
4. Connect it to Zerodha service layer

---

## ⚠️ Important Notes

* This project is for **educational purposes**
* Trading involves financial risk
* Do NOT expose your API keys publicly

---

## 🧠 When to Use This

Use this if:

* You are building AI trading agents
* You want structured API access via tools
* You are experimenting with MCP + finance

---

## 🚫 When NOT to Use This

Avoid if:

* You want a simple script (this is overkill)
* You don’t need AI/tool-based interaction
* You are not familiar with Zerodha APIs

---

## 🧪 Future Improvements

* Strategy automation layer
* Risk management module
* Backtesting engine
* Web dashboard
* Multi-broker support

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## 📜 License

MIT License

---

## 👨‍💻 Author

**Ujjval**

---

## ⭐ Support

If you find this useful, consider starring the repo ⭐
