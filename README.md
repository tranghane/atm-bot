# atm

A Discord bot foundation for expense tracking and budgeting.

## Current Status

- Bot connects to Discord using `discord.js`
- Replies `hello world` when a user sends `hello`
- Includes Oracle Free VM deployment with systemd
- Auto-restarts on crash, survives reboots

## Tech Stack

- Node.js
- discord.js
- dotenv
- systemd (production process manager)

## Project Structure

```text
atm/
├── src/
│   └── bot.js
├── deploy/
│   ├── oracle-vm-setup.sh
│   ├── oracle-vm-update.sh
│   └── atm.service
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

## Local Development (Background)

For local testing with background process, use PM2 manually:

```bash
# Install PM2 globally (optional)
npm install -g pm2

# Start bot in background
pm2 start src/bot.js --name atm

# Check status
pm2 list

# View logs
pm2 logs atm

# Stop
pm2 stop atm
```

Or just run in foreground:

```bash
npm start
```
systemd + Oracle)

```
┌─────────────────────────────────────────┐
│   Your PC (Development)                 │
│   ├── Local bot (npm start)             │
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
│   ├── Node.js + systemd                 │
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
- **systemd** = Native Linux service manager, keeps your bot running, auto-restarts on crash, auto-starts on reboot.
- **GitHub** = Sync code between your PC and the VM.
- Develop locally → push to GitHub → pull on VM → systemd auto-manages process
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
