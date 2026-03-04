const amountPattern = /(?:\$\s*\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s*\$|\b\d+(?:[.,]\d{1,2})?\b)/;

const expenseHintWords = [
  'spent',
  'pay',
  'paid',
  'bought',
  'cost',
  'uber',
  'coffee',
  'groceries',
  'rent',
  'food',
  'lunch',
  'dinner',
  'starbucks',
];

const negativeHintWords = [
  'help',
  'stats',
  'limit',
  'ping',
  'how',
  'what',
  'why',
];

function isExpenseCandidate(messageText) {
  const text = messageText.trim().toLowerCase();

  if (!text) {
    return false;
  }

  if (text.startsWith('/')) {
    return false;
  }

  if (text.length < 2) {
    return false;
  }

  let score = 0;

  if (amountPattern.test(text)) {
    score += 2;
  }

  if (expenseHintWords.some((word) => text.includes(word))) {
    score += 1;
  }

  if (negativeHintWords.some((word) => text.includes(word))) {
    score -= 2;
  }

  return score >= 2;
}

module.exports = {
  isExpenseCandidate,
};
