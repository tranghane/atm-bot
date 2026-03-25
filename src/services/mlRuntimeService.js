const path = require('node:path');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');

const execFileAsync = promisify(execFile);

const autoCategoryEnabled = String(process.env.ML_ENABLE_AUTO_CATEGORY || 'false').toLowerCase() === 'true';
const minCategoryConfidence = Number(process.env.ML_MIN_CONFIDENCE || '0.9');
const artifactDir = process.env.ML_ARTIFACT_DIR || '';
const predictCommand = process.env.ML_PREDICT_COMMAND || (process.platform === 'win32' ? 'py' : 'python3');
const predictCommandArgs = (process.env.ML_PREDICT_COMMAND_ARGS || (process.platform === 'win32' ? '-3.14' : ''))
  .split(/\s+/)
  .filter(Boolean);
const predictScriptPath = path.resolve(__dirname, '..', '..', 'scripts', 'ml', 'predict.py');

async function predictCategory(expenseText) {
  if (!autoCategoryEnabled) {
    return {
      predictedCategory: null,
      confidence: null,
      finalCategory: 'uncategorized',
      fallbackReason: 'auto_category_disabled',
    };
  }

  if (!artifactDir) {
    return {
      predictedCategory: null,
      confidence: null,
      finalCategory: 'uncategorized',
      fallbackReason: 'missing_artifact_dir',
    };
  }

  const commandArgs = [
    ...predictCommandArgs,
    predictScriptPath,
    '--artifact-dir',
    artifactDir,
    '--text',
    expenseText,
  ];

  try {
    const { stdout } = await execFileAsync(predictCommand, commandArgs, {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });

    const parsed = JSON.parse(stdout.trim());
    const predictedCategory = typeof parsed.predicted_category === 'string' ? parsed.predicted_category : null;
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : null;

    if (!predictedCategory) {
      return {
        predictedCategory: null,
        confidence,
        finalCategory: 'uncategorized',
        fallbackReason: 'invalid_prediction_output',
      };
    }

    if (confidence === null || confidence < minCategoryConfidence) {
      return {
        predictedCategory,
        confidence,
        finalCategory: 'uncategorized',
        fallbackReason: 'low_confidence',
      };
    }

    return {
      predictedCategory,
      confidence,
      finalCategory: predictedCategory,
      fallbackReason: null,
    };
  } catch (error) {
    console.error('Category prediction failed:', error.message);
    return {
      predictedCategory: null,
      confidence: null,
      finalCategory: 'uncategorized',
      fallbackReason: 'prediction_error',
    };
  }
}

module.exports = {
  predictCategory,
};
