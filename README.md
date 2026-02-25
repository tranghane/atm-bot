# atm

Discord bot foundation for expense tracking and budgeting.

## Current Status

- Slash command architecture implemented
- Commands available: `/ping`, `/add-expense`, `/set-limit`, `/stats`
- PostgreSQL-backed store via Prisma (Phase 2)
- Deployed option available via Oracle VM + systemd

## Tech Stack


- Node.js
- discord.js
- dotenv
- Prisma
- PostgreSQL
- systemd (production process manager)

## Project Structure

```text
atm/
├── src/
│   ├── bot.js
│   ├── commands/
│   │   ├── add-expense.js
│   │   ├── ping.js
│   │   ├── set-limit.js
│   │   └── stats.js
│   ├── scripts/
│   │   └── registerCommands.js
│   ├── services/
│   │   └── financeStore.js
│   └── utils/
│       └── commandLoader.js
├── prisma/
│   └── schema.prisma
├── deploy/
│   ├── atm.service
│   ├── oracle-vm-setup.sh
│   └── oracle-vm-update.sh
├── ORACLE_FREE_VM_DEPLOY.md
├── .env.example
├── .gitignore
└── package.json
```

## Prerequisites

- Node.js 18+ (22 recommended)
- Discord app and bot token

## Environment Variables

Create `.env` in project root:

```env
DISCORD_TOKEN=your_token_here
DISCORD_APP_ID=your_application_id_here
DISCORD_TEST_SERVER_ID=optional_test_server_id
DATABASE_URL=postgresql://username:password@localhost:5432/atm?schema=public
```

Notes:
- `DISCORD_TEST_SERVER_ID` is optional but recommended during development for instant slash command updates.
- If `DISCORD_TEST_SERVER_ID` is omitted, commands are registered globally (can take longer to appear).

## Local Development

Install dependencies:

```bash
npm install
```

Register slash commands:

```bash
npm run commands:register
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run Prisma migration (requires DATABASE_URL):

```bash
npm run prisma:migrate -- --name init
```

Run bot:

```bash
npm start
```

## Phase 2 Notes (Complete)

- Storage migrated from local JSON file (`data/finance-store.json`) to PostgreSQL.
- Prisma is now the data-access layer used by `src/services/financeStore.js`.
- Existing command behavior is unchanged from a user perspective, but all data now persists in DB tables.

## Current Database Schema (Basic)

- `User`
	- Primary key: `id`
	- Unique field: `discordUserId`
	- Relationship: one user has many categories, limits, and expenses.
- `Category`
	- Primary key: `id`
	- Foreign key: `userId -> User.id`
	- Constraint: unique pair `(userId, name)`.
- `CategoryLimit`
	- Primary key: `id`
	- Foreign keys: `userId -> User.id`, `categoryId -> Category.id`
	- Constraint: unique pair `(userId, categoryId)`.
- `Expense`
	- Primary key: `id`
	- Foreign keys: `userId -> User.id`, `categoryId -> Category.id` (optional)
	- Stores amount, merchant, timestamps.

## Prisma Studio (Database UI)

- Run Prisma Studio on the machine where your app/database are reachable:

```bash
npx prisma studio --port 5555
```

- If running on a remote VM, use an SSH tunnel from your local machine:

```bash
ssh -i "<path-to-private-key>" -L 5555:localhost:5555 <vm-user>@<vm-public-ip>
```

- Then open in browser: `http://localhost:5555`

## Slash Commands (Phase 1)

- `/ping` → health check
- `/add-expense amount merchant [category]` → add expense
- `/set-limit category limit` → set category spending limit
- `/stats` → show amount used and remaining against limits
- `/clear-data confirm:true` → clear your limits and expense history in the database

## Deployment

- Oracle VM setup guide: `ORACLE_FREE_VM_DEPLOY.md`

## Security Notes

- Never commit real tokens to GitHub.
- `.env` is ignored by `.gitignore`.

## TODO

### Phase 1: Slash Commands (Foundation)
- [x] Implement `/ping` command
- [x] Implement `/add-expense` command
- [x] Implement `/set-limit` command
- [x] Implement `/stats` command
- [x] Implement `/clear-data` command
- [x] Add command registration script
- [x] Organize code into commands/services/utils modules

### Phase 2: Database & Storage
- [x] Choose database (PostgreSQL + Prisma)
- [x] Design schema (User, Category, CategoryLimit, Expense)
- [x] Persist expenses and limits in database

### Phase 3: Expense Parser
- [ ] Parse message formats (`12$ starbucks`, `I spent 40 on groceries`, `uber 18`)
- [ ] Extract amount and merchant name
- [ ] Map to existing categories

### Phase 4: AI Category Classification
- [ ] Integrate LLM for category suggestions
- [ ] Add fallback flow for uncertain classifications

### Phase 5: Statistics & Analytics
- [ ] Expand monthly analytics and budget alerts
- [ ] Add narrative summary generation

### Phase 6: Web Dashboard
- [ ] Build API layer
- [ ] Build React dashboard

### Phase 7: Advanced AI Features (Optional)
- [ ] Chatbot mode for budget questions
- [ ] RAG with historical expenses
- [ ] AI emoji auto-reaction
