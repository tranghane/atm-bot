# Evaluate a saved model artifact, then export metrics and a confusion matrix.
import argparse
import json
import os

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate saved model on a parquet split")
    parser.add_argument("--artifact-dir", required=True)
    parser.add_argument("--input-parquet", default=None)
    parser.add_argument("--output-json", default=None)
    parser.add_argument("--confusion-matrix-csv", default=None)
    args = parser.parse_args()

    vectorizer_path = os.path.join(args.artifact_dir, "vectorizer.joblib")
    model_path = os.path.join(args.artifact_dir, "model.joblib")
    default_eval_path = os.path.join(args.artifact_dir, "test_split.parquet")

    eval_path = args.input_parquet or default_eval_path

    if not os.path.exists(eval_path):
        raise FileNotFoundError(f"Evaluation parquet not found: {eval_path}")

    frame = pd.read_parquet(eval_path)
    required = {"transaction_description", "category"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Input parquet is missing columns: {sorted(missing)}")

    x = frame["transaction_description"].astype(str)
    y_true = frame["category"].astype(str)

    vectorizer = joblib.load(vectorizer_path)
    model = joblib.load(model_path)

    x_vec = vectorizer.transform(x)
    y_pred = model.predict(x_vec)

    labels = sorted(set(y_true.tolist()) | set(y_pred.tolist()))
    matrix = confusion_matrix(y_true, y_pred, labels=labels)
    matrix_rows = []
    for i, true_label in enumerate(labels):
        row = {"true_label": true_label}
        for j, pred_label in enumerate(labels):
            row[pred_label] = int(matrix[i, j])
        matrix_rows.append(row)

    accuracy = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)

    output = {
        "artifact_dir": args.artifact_dir,
        "input_parquet": eval_path,
        "rows": int(len(frame)),
        "accuracy": float(accuracy),
        "macro_f1": float(macro_f1),
        "labels": labels,
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
        "confusion_matrix_labels": labels,
    }

    output_json_path = args.output_json or os.path.join(args.artifact_dir, "evaluation_report.json")
    confusion_csv_path = args.confusion_matrix_csv or os.path.join(args.artifact_dir, "confusion_matrix.csv")

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    pd.DataFrame(matrix_rows).to_csv(confusion_csv_path, index=False)

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
