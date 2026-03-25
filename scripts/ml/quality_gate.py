#!/usr/bin/env python3
import argparse
import json
import os
import sys


def load_evaluation(artifact_dir: str, evaluation_json: str | None) -> dict:
    path = evaluation_json or os.path.join(artifact_dir, "evaluation_report.json")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Evaluation report not found: {path}. Run evaluate.py first to generate it."
        )

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply quality gates to model evaluation report")
    parser.add_argument("--artifact-dir", required=True)
    parser.add_argument("--evaluation-json", default=None)
    parser.add_argument("--min-accuracy", type=float, default=0.95)
    parser.add_argument("--min-macro-f1", type=float, default=0.95)
    parser.add_argument("--min-recall", type=float, default=0.90)
    parser.add_argument("--output-json", default=None)
    args = parser.parse_args()

    evaluation = load_evaluation(args.artifact_dir, args.evaluation_json)
    report = evaluation.get("classification_report", {})

    failing_checks = []

    accuracy = float(evaluation.get("accuracy", 0.0))
    macro_f1 = float(evaluation.get("macro_f1", 0.0))

    if accuracy < args.min_accuracy:
        failing_checks.append(
            {
                "type": "global_accuracy",
                "actual": accuracy,
                "required": args.min_accuracy,
            }
        )

    if macro_f1 < args.min_macro_f1:
        failing_checks.append(
            {
                "type": "global_macro_f1",
                "actual": macro_f1,
                "required": args.min_macro_f1,
            }
        )

    aggregate_keys = {"accuracy", "macro avg", "weighted avg"}
    per_class = {}

    for label, metrics in report.items():
        if label in aggregate_keys:
            continue
        if not isinstance(metrics, dict):
            continue

        recall = float(metrics.get("recall", 0.0))
        per_class[label] = {
            "precision": float(metrics.get("precision", 0.0)),
            "recall": recall,
            "f1_score": float(metrics.get("f1-score", 0.0)),
            "support": int(metrics.get("support", 0)),
        }

        if recall < args.min_recall:
            failing_checks.append(
                {
                    "type": "class_recall",
                    "label": label,
                    "actual": recall,
                    "required": args.min_recall,
                }
            )

    passed = len(failing_checks) == 0

    output = {
        "passed": passed,
        "thresholds": {
            "min_accuracy": args.min_accuracy,
            "min_macro_f1": args.min_macro_f1,
            "min_recall": args.min_recall,
        },
        "actual": {
            "accuracy": accuracy,
            "macro_f1": macro_f1,
        },
        "per_class": per_class,
        "failing_checks": failing_checks,
    }

    output_json_path = args.output_json or os.path.join(args.artifact_dir, "quality_gate.json")
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(json.dumps(output, indent=2))

    if not passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
