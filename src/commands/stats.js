const { SlashCommandBuilder } = require('discord.js');
const financeStore = require('../services/financeStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show your current month spending stats'),

  async execute(interaction) {
    const stats = financeStore.getMonthlyStats(interaction.user.id);

    if (stats.transactionCount === 0) {
      await interaction.reply('No expenses recorded this month yet.');
      return;
    }

    const categoryLines = stats.categoryRows
      .sort((left, right) => right.spent - left.spent)
      .map((row) => {
        const limitText = typeof row.limit === 'number' ? ` / limit $${row.limit.toFixed(2)}` : '';
        const remainingText = typeof row.remaining === 'number' ? ` / remaining $${row.remaining.toFixed(2)}` : '';
        return `• ${row.category}: $${row.spent.toFixed(2)} (${row.percentage.toFixed(1)}%)${limitText}${remainingText}`;
      })
      .join('\n');

    await interaction.reply(
      `This month:\nTotal: $${stats.totalSpent.toFixed(2)}\nTransactions: ${stats.transactionCount}\n\n${categoryLines}`
    );
  },
};
