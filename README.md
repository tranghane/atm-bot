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
