const amountTokenPattern = /(?:\$\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*\$|\b\d+(?:[.,]\d+)?\b)/;

const fillerWordsPattern = /\b(?:i|im|i['’]m|spent|pay|paid|bought|cost|on|at|for)\b/gi;

function parseExpenseCandidate(messageText) {
  const originalMessage = String(messageText ?? '');
  const normalizedMessage = originalMessage.replace(/\s+/g, ' ').trim().toLowerCase();

  const amountMatch = originalMessage.match(amountTokenPattern);
  const amountToken = amountMatch ? amountMatch[0] : null;
  const isCandidate = Boolean(amountToken);

  let amount = null;
  if (amountToken) {
    const normalizedAmountToken = amountToken
      .replace(/\$/g, '')
      .replace(/\s+/g, '')
      .replace(',', '.');

    const parsedAmount = parseFloat(normalizedAmountToken);
    amount = Number.isNaN(parsedAmount) ? null : parsedAmount;
  }

  let expenseText = originalMessage;
  if (amountToken) {
    expenseText = expenseText.replace(amountTokenPattern, '');
  }

  expenseText = expenseText
    .replace(fillerWordsPattern, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    isCandidate,
    amountToken,
    amount,
    expense_text: expenseText,
    normalizedMessage,
  };
}

function isExpenseCandidate(messageText) {
  return parseExpenseCandidate(messageText).isCandidate;
}

module.exports = {
  parseExpenseCandidate,
  isExpenseCandidate,
};
