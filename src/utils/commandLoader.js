const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');

function loadCommands() {
  const commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  for (const fileName of commandFiles) {
    const filePath = path.join(commandsPath, fileName);
    const command = require(filePath);

    if (!command.data || !command.execute) {
      console.warn(`Skipping command file ${fileName}: missing data or execute`);
      continue;
    }

    commands.set(command.data.name, command);
  }

  return commands;
}

function commandDataForRegistration() {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  return commandFiles
    .map((fileName) => {
      const command = require(path.join(commandsPath, fileName));
      return command.data?.toJSON?.();
    })
    .filter(Boolean);
}

module.exports = {
  loadCommands,
  commandDataForRegistration,
};
