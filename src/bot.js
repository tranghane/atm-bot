require('dotenv').config();
const path = require('node:path');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { Client, GatewayIntentBits } = require('discord.js');
const { loadCommands } = require('./utils/commandLoader');
const { parseExpenseCandidate } = require('./parsers/isExpenseCandidate');

const execFileAsync = promisify(execFile);

const allowedExpenseChannelIds = new Set(
  (process.env.DISCORD_EXPENSE_CHANNEL_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);

function isAllowedExpenseChannel(channelId) {
  if (!channelId) return false;
  if (allowedExpenseChannelIds.size === 0) return true;
  return allowedExpenseChannelIds.has(channelId);
}

const autoCategoryEnabled = String(process.env.ML_ENABLE_AUTO_CATEGORY || 'false').toLowerCase() === 'true';
const minCategoryConfidence = Number(process.env.ML_MIN_CONFIDENCE || '0.9');
const mlArtifactDir = process.env.ML_ARTIFACT_DIR || '';
const mlPredictCommand = process.env.ML_PREDICT_COMMAND || (process.platform === 'win32' ? 'py' : 'python3');
const mlPredictCommandArgs = (process.env.ML_PREDICT_COMMAND_ARGS || (process.platform === 'win32' ? '-3.14' : ''))
  .split(/\s+/)
  .filter(Boolean);
const mlPredictScriptPath = path.resolve(__dirname, '..', 'scripts', 'ml', 'predict.py');

async function predictCategoryFromExpenseText(expenseText) {
  if (!autoCategoryEnabled) {
    return {
      predictedCategory: null,
      confidence: null,
      finalCategory: 'uncategorized',
      fallbackReason: 'auto_category_disabled',
    };
  }

  if (!mlArtifactDir) {
    return {
      predictedCategory: null,
      confidence: null,
      finalCategory: 'uncategorized',
      fallbackReason: 'missing_artifact_dir',
    };
  }

  const commandArgs = [
    ...mlPredictCommandArgs,
    mlPredictScriptPath,
    '--artifact-dir',
    mlArtifactDir,
    '--text',
    expenseText,
  ];

  try {
    const { stdout } = await execFileAsync(mlPredictCommand, commandArgs, {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });

    const parsed = JSON.parse(stdout.trim());
    const predictedCategory = typeof parsed.predicted_category === 'string' ? parsed.predicted_category : null;
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : null;

    if (!predictedCategory) {
      return {
        predictedCategory: null,
        confidence,
        finalCategory: 'uncategorized',
        fallbackReason: 'invalid_prediction_output',
      };
    }

    if (confidence === null || confidence < minCategoryConfidence) {
      return {
        predictedCategory,
        confidence,
        finalCategory: 'uncategorized',
        fallbackReason: 'low_confidence',
      };
    }

    return {
      predictedCategory,
      confidence,
      finalCategory: predictedCategory,
      fallbackReason: null,
    };
  } catch (error) {
    console.error('Category prediction failed:', error.message);
    return {
      predictedCategory: null,
      confidence: null,
      finalCategory: 'uncategorized',
      fallbackReason: 'prediction_error',
    };
  }
}

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = loadCommands();

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}. Loaded ${client.commands.size} command(s).`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Command not found.', ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error running /${interaction.commandName}:`, error);
    const errorMessage = { content: 'There was an error while executing this command.', ephemeral: true };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorMessage);
      return;
    }

    await interaction.reply(errorMessage);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!isAllowedExpenseChannel(message.channelId)) return;

  const text = message.content.trim();
  if (!text || text.startsWith('/')) return;

  const parsed = parseExpenseCandidate(text);

  if (!parsed.isCandidate) {
    await message.reply('not an expense candidate ❌');
    return;
  }

  const classification = await predictCategoryFromExpenseText(parsed.expense_text || '');

  console.log(
    JSON.stringify({
      event: 'expense_category_prediction',
      expense_text: parsed.expense_text || null,
      predicted_category: classification.predictedCategory,
      confidence: classification.confidence,
      final_category: classification.finalCategory,
      fallback_reason: classification.fallbackReason,
    }),
  );

  await message.reply(
    [
      'expense candidate ✅',
      `amount token: ${parsed.amountToken ?? 'n/a'}`,
      `amount: ${parsed.amount ?? 'n/a'}`,
      `expense_text: ${parsed.expense_text || 'n/a'}`,
      `predicted category: ${classification.predictedCategory ?? 'n/a'}`,
      `confidence: ${classification.confidence ?? 'n/a'}`,
      `final category: ${classification.finalCategory}`,
      `fallback reason: ${classification.fallbackReason ?? 'n/a'}`,
    ].join('\n'),
  );
});

client.login(token);
