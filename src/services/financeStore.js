const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_CATEGORY = 'uncategorized';
const dataDirPath = path.join(__dirname, '..', '..', 'data');
const dataFilePath = path.join(dataDirPath, 'finance-store.json');

function ensureStoreFile() {
  if (!fs.existsSync(dataDirPath)) {
    fs.mkdirSync(dataDirPath, { recursive: true });
  }

  if (!fs.existsSync(dataFilePath)) {
    const initialStore = { users: {} };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialStore, null, 2), 'utf8');
  }
}

function loadStore() {
  ensureStoreFile();

  try {
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    const parsed = JSON.parse(fileContent);
    if (!parsed.users || typeof parsed.users !== 'object') {
      return { users: {} };
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to load finance store. Reinitializing empty store.', error);
    return { users: {} };
  }
}

function saveStore(store) {
  ensureStoreFile();
  fs.writeFileSync(dataFilePath, JSON.stringify(store, null, 2), 'utf8');
}

function getOrCreateUserRecord(store, userId) {
  if (!store.users[userId]) {
    store.users[userId] = {
      expenses: [],
      limits: {},
    };
  }

  if (!Array.isArray(store.users[userId].expenses)) {
    store.users[userId].expenses = [];
  }

  if (!store.users[userId].limits || typeof store.users[userId].limits !== 'object') {
    store.users[userId].limits = {};
  }

  return store.users[userId];
}

function addExpense({ userId, amount, merchant, category }) {
  const store = loadStore();
  const userRecord = getOrCreateUserRecord(store, userId);
  const normalizedCategory = (category || DEFAULT_CATEGORY).trim().toLowerCase();

  userRecord.expenses.push({
    amount,
    merchant: merchant.trim(),
    category: normalizedCategory,
    date: new Date().toISOString(),
  });

  saveStore(store);

  return { category: normalizedCategory };
}

function setCategoryLimit({ userId, category, limit }) {
  const store = loadStore();
  const userRecord = getOrCreateUserRecord(store, userId);
  const normalizedCategory = category.trim().toLowerCase();
  userRecord.limits[normalizedCategory] = limit;
  saveStore(store);
  return normalizedCategory;
}

function getStats(userId) {
  const store = loadStore();
  const userRecord = getOrCreateUserRecord(store, userId);
  const allExpenses = userRecord.expenses;

  const totalSpent = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const byCategory = new Map();
  for (const expense of allExpenses) {
    const current = byCategory.get(expense.category) || 0;
    byCategory.set(expense.category, current + expense.amount);
  }

  const limits = userRecord.limits;

  const categoryRows = Array.from(byCategory.entries()).map(([category, spent]) => {
    const limit = typeof limits[category] === 'number' ? limits[category] : null;
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
    transactionCount: allExpenses.length,
    categoryRows,
  };
}

function clearStoreFile() {
  const emptyStore = { users: {} };
  saveStore(emptyStore);
}

module.exports = {
  DEFAULT_CATEGORY,
  addExpense,
  setCategoryLimit,
  getStats,
  clearStoreFile,
};
