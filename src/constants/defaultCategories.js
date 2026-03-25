const DEFAULT_DATASET_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping & Retail',
  'Entertainment & Recreation',
  'Healthcare & Medical',
  'Utilities & Services',
  'Financial Services',
  'Income',
  'Government & Legal',
  'Charity & Donations',
];

const DEFAULT_DATASET_CATEGORY_SET = new Set(DEFAULT_DATASET_CATEGORIES);

function isDefaultDatasetCategory(category) {
  if (!category) return false;
  return DEFAULT_DATASET_CATEGORY_SET.has(category);
}

module.exports = {
  DEFAULT_DATASET_CATEGORIES,
  DEFAULT_DATASET_CATEGORY_SET,
  isDefaultDatasetCategory,
};
