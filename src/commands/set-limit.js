const { SlashCommandBuilder } = require('discord.js');
const financeStore = require('../services/financeStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-limit')
    .setDescription('Set a spending limit for a category')
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('Category name (e.g., food)')
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName('limit')
        .setDescription('Limit amount')
        .setRequired(true)
        .setMinValue(0.01)
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category');
    const limit = interaction.options.getNumber('limit');

    const normalizedCategory = financeStore.setCategoryLimit({
      userId: interaction.user.id,
      category,
      limit,
    });

    await interaction.reply(`Set spending limit for ${normalizedCategory} to $${limit.toFixed(2)}`);
  },
};
