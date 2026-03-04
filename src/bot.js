require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { loadCommands } = require('./utils/commandLoader');
const { isExpenseCandidate } = require('./parsers/isExpenseCandidate');

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

  if (message.content.trim().startsWith('/')) return;

  const expenseCandidate = isExpenseCandidate(message.content);
  const resultText = expenseCandidate ? 'is an expense' : 'is not an expense';
  await message.reply(`${message.content} ${resultText}`);
});

client.login(token);
