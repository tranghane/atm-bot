require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { loadCommands } = require('./utils/commandLoader');
const { parseExpenseCandidate } = require('./parsers/isExpenseCandidate');

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

  await message.reply(
    [
      'expense candidate ✅',
      `amount token: ${parsed.amountToken ?? 'n/a'}`,
      `amount: ${parsed.amount ?? 'n/a'}`,
      `expense_text: ${parsed.expense_text || 'n/a'}`,
    ].join('\n'),
  );
});

client.login(token);
