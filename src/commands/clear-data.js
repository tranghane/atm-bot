const { SlashCommandBuilder } = require('discord.js');
const financeStore = require('../services/financeStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-data')
    .setDescription('Clear the local finance JSON file (all stored data)')
    .addBooleanOption((option) =>
      option
        .setName('confirm')
        .setDescription('Set true to confirm permanent deletion')
        .setRequired(true)
    ),

  async execute(interaction) {
    const confirm = interaction.options.getBoolean('confirm');

    if (!confirm) {
      await interaction.reply('Cancelled. Your data was not changed.');
      return;
    }

    await financeStore.clearStoreFile(interaction.user.id);
    await interaction.reply('Your limits and expense history were cleared from the database.');
  },
};
