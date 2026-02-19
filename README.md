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

Your bot needs a process running continuously and connected to Discord. Here's how it works:

### Local Development (Your PC)

- `npm start` or `npm run bot:online` runs the bot on your PC.
- PM2 keeps it running in the background even if you close the terminal.
- **Problem:** Bot goes offline when your PC shuts down/sleeps.

### Production Deployment (Oracle Free VM)

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

**Why this works:**

1. **Oracle VM** = Free Linux computer in Oracle's data center (always powered on).
2. **PM2** = Process manager that keeps your Node.js bot running.
   - Auto-restarts bot if it crashes.
   - Keeps bot alive even if terminal closes.
   - Configured to start bot automatically when VM reboots.
3. **Public IP** = The VM has an internet address, so Discord API can reach your bot anytime.
4. **GitHub** = Acts as a central hub for your code.
   - Develop locally on your PC.
   - Push changes to GitHub.
   - Pull latest code on the VM and restart bot.

### Workflow Summary

1. You write/edit bot code on your PC locally.
2. Test locally with `npm run bot:online`.
3. Push code to GitHub: `git push`.
4. SSH into the Oracle VM.
5. Pull latest code: `git pull`.
6. Restart bot: `npm run bot:online`.
7. Bot is now running on the VM with the new code.
8. Your PC can shut down—bot stays online on the Oracle VM.

### Key Advantage

You get **always-on hosting for free** (Oracle Always Free tier). Your PC is only needed for development; the VM handles production.

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
