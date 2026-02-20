const { SlashCommandBuilder } = require('discord.js');
const financeStore = require('../services/financeStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-expense')
    .setDescription('Add an expense entry')
    .addNumberOption((option) =>
      option
        .setName('amount')
        .setDescription('Amount spent')
        .setRequired(true)
        .setMinValue(0.01)
    )
    .addStringOption((option) =>
      option
        .setName('merchant')
        .setDescription('Where you spent money')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('Optional category (e.g., food, transport)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const amount = interaction.options.getNumber('amount');
    const merchant = interaction.options.getString('merchant');
    const category = interaction.options.getString('category');

    const result = financeStore.addExpense({
      userId: interaction.user.id,
      amount,
      merchant,
      category,
    });

    await interaction.reply(
      `Added expense: $${amount.toFixed(2)} at ${merchant} (category: ${result.category})`
    );
  },
};
