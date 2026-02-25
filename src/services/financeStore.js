const prisma = require('../lib/prisma');

const DEFAULT_CATEGORY = 'uncategorized';
async function getOrCreateUser(discordUserId) {
  return prisma.user.upsert({
    where: { discordUserId },
    update: {},
    create: { discordUserId },
  });
}

async function getOrCreateCategory(userId, categoryName) {
  return prisma.category.upsert({
    where: {
      userId_name: {
        userId,
        name: categoryName,
      },
    },
    update: {},
    create: {
      userId,
      name: categoryName,
    },
  });
}

async function addExpense({ userId, amount, merchant, category }) {
  const user = await getOrCreateUser(userId);
  const normalizedCategory = (category || DEFAULT_CATEGORY).trim().toLowerCase();
  const categoryRecord = await getOrCreateCategory(user.id, normalizedCategory);

  await prisma.expense.create({
    data: {
      userId: user.id,
      categoryId: categoryRecord.id,
      amount,
      merchant: merchant.trim(),
    },
  });

  return { category: normalizedCategory };
}

async function setCategoryLimit({ userId, category, limit }) {
  const user = await getOrCreateUser(userId);
  const normalizedCategory = category.trim().toLowerCase();
  const categoryRecord = await getOrCreateCategory(user.id, normalizedCategory);

  await prisma.categoryLimit.upsert({
    where: {
      userId_categoryId: {
        userId: user.id,
        categoryId: categoryRecord.id,
      },
    },
    update: {
      amount: limit,
    },
    create: {
      userId: user.id,
      categoryId: categoryRecord.id,
      amount: limit,
    },
  });

  return normalizedCategory;
}

async function getStats(userId) {
  const user = await prisma.user.findUnique({
    where: { discordUserId: userId },
  });

  if (!user) {
    return {
      totalSpent: 0,
      transactionCount: 0,
      categoryRows: [],
    };
  }

  const [expenses, limits] = await Promise.all([
    prisma.expense.findMany({
      where: { userId: user.id },
      include: { category: true },
    }),
    prisma.categoryLimit.findMany({
      where: { userId: user.id },
      include: { category: true },
    }),
  ]);

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const byCategory = new Map();
  for (const expense of expenses) {
    const categoryName = expense.category?.name || DEFAULT_CATEGORY;
    const current = byCategory.get(categoryName) || 0;
    byCategory.set(categoryName, current + Number(expense.amount));
  }

  const limitsByCategory = new Map();
  for (const limitRecord of limits) {
    limitsByCategory.set(limitRecord.category.name, Number(limitRecord.amount));
  }

  for (const [categoryName, limitAmount] of limitsByCategory.entries()) {
    if (!byCategory.has(categoryName)) {
      byCategory.set(categoryName, 0);
    }
  }

  const categoryRows = Array.from(byCategory.entries()).map(([category, spent]) => {
    const limit = limitsByCategory.has(category) ? limitsByCategory.get(category) : null;
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
    transactionCount: expenses.length,
    categoryRows,
  };
}

async function clearStoreFile(userId) {
  const user = await prisma.user.findUnique({
    where: { discordUserId: userId },
  });

  if (!user) {
    return;
  }

  await prisma.$transaction([
    prisma.expense.deleteMany({ where: { userId: user.id } }),
    prisma.categoryLimit.deleteMany({ where: { userId: user.id } }),
    prisma.category.deleteMany({ where: { userId: user.id } }),
  ]);
}

module.exports = {
  DEFAULT_CATEGORY,
  addExpense,
  setCategoryLimit,
  getStats,
  clearStoreFile,
};
