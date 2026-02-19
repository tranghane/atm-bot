# atm

A Discord bot foundation for expense tracking and budgeting.

## Current Status

- Bot connects to Discord using `discord.js`
- Replies `hello world` when a user sends `hello`
- Runs in background with PM2
- Includes Oracle Free VM deployment scripts

## Tech Stack

- Node.js
- discord.js
- dotenv
- PM2

## Project Structure

```text
atm/
├── src/
│   └── bot.js
├── deploy/
│   ├── oracle-vm-setup.sh
│   └── oracle-vm-update.sh
├── ecosystem.config.js
├── ORACLE_FREE_VM_DEPLOY.md
├── .env.example
├── .gitignore
└── package.json
```

## Prerequisites

- Node.js 18+ (22 recommended)
- Discord bot token in `.env`

## Environment Variables

Create `.env` in the project root:

```env
DISCORD_TOKEN=your_token_here
```

## Local Development

Install dependencies:

```bash
npm install
```

Run bot (foreground):

```bash
npm start
```

## PM2 Commands (Background)

Start bot:

```bash
npm run bot:online
```

Check status:

```bash
npm run bot:status
```

View logs:

```bash
npm run bot:logs
```

Stop bot:

```bash
npm run bot:offline
```

## How the Bot Stays Online 24/7 (PM2 + Oracle)

```
┌─────────────────────────────────────────┐
│   Your PC (Development)                 │
│   ├── Local bot with PM2                │
│   └── Push code to GitHub               │
└─────────────────┬───────────────────────┘
                  │ git push
                  ▼
┌─────────────────────────────────────────┐
│   GitHub (Code Repository)              │
│   └── Central storage for your bot code │
└─────────────────┬───────────────────────┘
                  │ git clone / git pull
                  ▼
┌─────────────────────────────────────────┐
│   Oracle Free VM (Production Server)    │
│   ├── Ubuntu Linux (Always On)          │
│   ├── Node.js + PM2                     │
│   ├── Bot process running 24/7          │
│   └── Public IP (Discord can reach it)  │
└─────────────────────────────────────────┘
                  │
                  │ Connected to Discord API
                  ▼
┌─────────────────────────────────────────┐
│   Discord                               │
│   ├── Listens to bot commands           │
│   └── Sends messages to bot             │
└─────────────────────────────────────────┘
```

**How it works:**
- **Oracle VM** = Free always-on Linux server (your PC is only for development).
- **PM2** = Keeps your bot running, auto-restarts on crash.
- **GitHub** = Sync code between your PC and the VM.
- Develop locally → push to GitHub → pull on VM → restart bot with PM2.

## Deployment (Oracle Free VM)

Follow:

- `ORACLE_FREE_VM_DEPLOY.md`

## Security Notes

- Never commit real tokens to GitHub.
- `.env` is ignored by `.gitignore`.

## Roadmap

- Slash commands (`/ping`, `/add-expense`, `/set-limit`, `/stats`)
- Expense parser (regex + AI category classification)
- Monthly statistics and budget summaries
- Web dashboard
