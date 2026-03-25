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
- Python 3.14+ via Python Manager (`py` launcher on Windows)
- Discord app and bot token

## Environment Variables

Create `.env` in project root:

```env
DISCORD_TOKEN=your_token_here
DISCORD_APP_ID=your_application_id_here
DISCORD_TEST_SERVER_ID=optional_test_server_id
DISCORD_EXPENSE_CHANNEL_IDS=comma_separated_channel_ids
DATABASE_URL=postgresql://username:password@localhost:5432/atm?schema=public
```

Notes:
- `DISCORD_TEST_SERVER_ID` is optional but recommended during development for instant slash command updates.
- If `DISCORD_TEST_SERVER_ID` is omitted, commands are registered globally (can take longer to appear).
- `DISCORD_EXPENSE_CHANNEL_IDS` controls which channels are monitored for expense-text intake (comma-separated channel IDs).

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

## Phase 3A: Dataset Access + Category Taxonomy Lock

Use this phase to lock the category contract before model training.

### 1) Dataset Access (Manual Gate)

- Open: [mitulshah/transaction-categorization](https://huggingface.co/datasets/mitulshah/transaction-categorization)
- Accept dataset access terms (required by Hugging Face before files are downloadable).
- Verify you can access dataset files and metadata.

### 2) Canonical Default Categories (Source of Truth)

These are the 10 default bot categories and must remain exact for Phase 3 model output:

1. Food & Dining
2. Transportation
3. Shopping & Retail
4. Entertainment & Recreation
5. Healthcare & Medical
6. Utilities & Services
7. Financial Services
8. Income
9. Government & Legal
10. Charity & Donations

Implementation source:

- `src/constants/defaultCategories.js`

### 3) Label Policy

- Persist and display category labels exactly as listed above.
- Any model prediction must map to one of these 10 labels or `uncategorized`.
- Normalization is allowed only for internal matching logic (not for stored/displayed labels).

## Phase 3B: Baseline Training Pipeline (Offline)

This phase builds a first text-classification baseline from `expense_text` to one of the 10 default categories.

### 1) Install ML dependencies

```bash
npm run ml:install
```

### 2) Train baseline model

```bash
npm run ml:train
```

Notes:
- Default source is Hugging Face dataset (`mitulshah/transaction-categorization`).
- Default run samples up to 300k rows for faster iteration.
- Artifacts are written to `scripts/ml/artifacts/<version>/`.

Optional local parquet training:

```bash
py -3.14 scripts/ml/train.py --source parquet --parquet-path "path/to/0000.parquet"
```

### 3) Evaluate saved artifact

```bash
py -3.14 scripts/ml/evaluate.py --artifact-dir "scripts/ml/artifacts/<version>"
```

This also writes:
- `evaluation_report.json`
- `confusion_matrix.csv`

### 4) Predict a single `expense_text`

```bash
py -3.14 scripts/ml/predict.py --artifact-dir "scripts/ml/artifacts/<version>" --text "uber ride downtown"
```

### 5) Apply Phase 3C quality gate

```bash
py -3.14 scripts/ml/quality_gate.py --artifact-dir "scripts/ml/artifacts/<version>"
```

Default gate thresholds:
- `min_accuracy = 0.95`
- `min_macro_f1 = 0.95`
- `min_recall = 0.90` (per-category recall floor)

Quality gate output:
- `quality_gate.json`
- exit code `0` on pass, `1` on fail

### 6) Run Phase 3C end-to-end (latest artifact)

```bash
npm run ml:evaluate-current-model
```

What this does:
- Automatically selects the latest directory under `scripts/ml/artifacts/`
- Runs `evaluate.py`
- Runs `quality_gate.py`
- Prints final pass/fail summary

### Artifacts produced per run

- `model.joblib`
- `vectorizer.joblib`
- `metrics.json`
- `test_split.parquet`
- `evaluation_report.json`
- `confusion_matrix.csv`
- `quality_gate.json` (after Phase 3C gate run)

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
- [x] Parse message formats (`12$ starbucks`, `I spent 40 on groceries`, `uber 18`)
- [x] Choose dataset for category modeling: [mitulshah/transaction-categorization](https://huggingface.co/datasets/mitulshah/transaction-categorization)
- [x] Lock canonical default category taxonomy (10 categories)
- [x] Confirm gated dataset access accepted (owner action in browser)
- [ ] Build training dataset from `expense_text` + dataset category labels
- [ ] Start with a simple baseline classifier (use dataset categories as-is)
- [ ] Evaluate on holdout split (accuracy + macro F1) and save model artifacts
- [x] Add confusion matrix + evaluation report artifacts
- [x] Add model quality gate script (pass/fail by thresholds)
- [ ] Add inference helper: `categorizeExpenseText(expenseText)`
- [ ] Wire parser flow to call classifier and return predicted category + confidence
- [ ] Add fallback behavior when confidence is low (`uncategorized`)
- [ ] Log prediction outcomes to prepare future fine-tuning

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
