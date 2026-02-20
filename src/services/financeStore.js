const DEFAULT_CATEGORY = 'uncategorized';

const store = {
  expensesByUser: new Map(),
  limitsByUser: new Map(),
};

function getUserExpenses(userId) {
  if (!store.expensesByUser.has(userId)) {
    store.expensesByUser.set(userId, []);
  }

  return store.expensesByUser.get(userId);
}

function getUserLimits(userId) {
  if (!store.limitsByUser.has(userId)) {
    store.limitsByUser.set(userId, new Map());
  }

  return store.limitsByUser.get(userId);
}

function addExpense({ userId, amount, merchant, category }) {
  const normalizedCategory = (category || DEFAULT_CATEGORY).trim().toLowerCase();
  const expenses = getUserExpenses(userId);

  expenses.push({
    amount,
    merchant: merchant.trim(),
    category: normalizedCategory,
    date: new Date(),
  });

  return { category: normalizedCategory };
}

function setCategoryLimit({ userId, category, limit }) {
  const normalizedCategory = category.trim().toLowerCase();
  const limits = getUserLimits(userId);
  limits.set(normalizedCategory, limit);
  return normalizedCategory;
}

function getMonthlyStats(userId) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = getUserExpenses(userId).filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const byCategory = new Map();
  for (const expense of monthlyExpenses) {
    const current = byCategory.get(expense.category) || 0;
    byCategory.set(expense.category, current + expense.amount);
  }

  const limits = getUserLimits(userId);

  const categoryRows = Array.from(byCategory.entries()).map(([category, spent]) => {
    const limit = limits.get(category);
    const remaining = typeof limit === 'number' ? limit - spent : null;

    return {
      category,
      spent,
      limit,
      remaining,
      percentage: totalSpent > 0 ? (spent / totalSpent) * 100 : 0,
    };
  });

  return {
    totalSpent,
    transactionCount: monthlyExpenses.length,
    categoryRows,
  };
}

module.exports = {
  DEFAULT_CATEGORY,
  addExpense,
  setCategoryLimit,
  getMonthlyStats,
};
