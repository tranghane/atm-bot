require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { commandDataForRegistration } = require('../utils/commandLoader');

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_APP_ID;
const testServerId = process.env.DISCORD_TEST_SERVER_ID;

if (!token || !appId) {
  console.error('Missing DISCORD_TOKEN or DISCORD_APP_ID in .env');
  process.exit(1);
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(token);
  const commands = commandDataForRegistration();

  try {
    if (testServerId) {
      await rest.put(Routes.applicationGuildCommands(appId, testServerId), { body: commands });
      console.log(`Registered ${commands.length} guild command(s) for ${testServerId}.`);
    } else {
      await rest.put(Routes.applicationCommands(appId), { body: commands });
      console.log(`Registered ${commands.length} global command(s).`);
    }
  } catch (error) {
    console.error('Failed to register commands:', error);
    process.exit(1);
  }
}

registerCommands();
