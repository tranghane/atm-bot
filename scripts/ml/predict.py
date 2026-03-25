#!/usr/bin/env python3
import argparse
import json
import os

import joblib
import numpy as np


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict category for one expense_text")
    parser.add_argument("--artifact-dir", required=True)
    parser.add_argument("--text", required=True)
    args = parser.parse_args()

    vectorizer_path = os.path.join(args.artifact_dir, "vectorizer.joblib")
    model_path = os.path.join(args.artifact_dir, "model.joblib")

    vectorizer = joblib.load(vectorizer_path)
    model = joblib.load(model_path)

    x_vec = vectorizer.transform([args.text])
    pred_label = model.predict(x_vec)[0]

    confidence = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(x_vec)[0]
        confidence = float(np.max(probs))

    output = {
        "expense_text": args.text,
        "predicted_category": pred_label,
        "confidence": confidence,
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
