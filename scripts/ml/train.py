#Train the baseline expense-text category model and write versioned artifacts.
import argparse
import json
import os
from datetime import datetime, timezone
from typing import Optional

import joblib
import pandas as pd
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split


def load_training_frame(source: str, parquet_path: Optional[str]) -> pd.DataFrame:
    if source == "parquet":
        if not parquet_path:
            raise ValueError("--parquet-path is required when --source parquet")
        frame = pd.read_parquet(parquet_path)
    else:
        ds = load_dataset("mitulshah/transaction-categorization", split="train")
        frame = ds.to_pandas()

    required = {"transaction_description", "category"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")

    frame = frame[["transaction_description", "category"]].dropna()
    frame["transaction_description"] = frame["transaction_description"].astype(str)
    frame["category"] = frame["category"].astype(str)
    frame = frame[frame["transaction_description"].str.strip() != ""]
    return frame


def main() -> None:
    parser = argparse.ArgumentParser(description="Train baseline expense category model")
    parser.add_argument("--source", choices=["hf", "parquet"], default="hf")
    parser.add_argument("--parquet-path", default=None)
    parser.add_argument("--sample-size", type=int, default=300000)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--max-features", type=int, default=100000)
    parser.add_argument("--artifact-dir", default="scripts/ml/artifacts")
    args = parser.parse_args()

    frame = load_training_frame(args.source, args.parquet_path)

    if args.sample_size and len(frame) > args.sample_size:
        frame = frame.sample(n=args.sample_size, random_state=args.random_state)

    x = frame["transaction_description"]
    y = frame["category"]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=y,
    )

    vectorizer = TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        ngram_range=(1, 2),
        max_features=args.max_features,
        min_df=2,
    )

    x_train_vec = vectorizer.fit_transform(x_train)
    x_test_vec = vectorizer.transform(x_test)

    model = LogisticRegression(
        max_iter=400,
    )
    model.fit(x_train_vec, y_train)

    y_pred = model.predict(x_test_vec)

    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    version = datetime.now(timezone.utc).strftime("v%Y%m%d-%H%M%S")
    out_dir = os.path.join(args.artifact_dir, version)
    os.makedirs(out_dir, exist_ok=True)

    joblib.dump(vectorizer, os.path.join(out_dir, "vectorizer.joblib"))
    joblib.dump(model, os.path.join(out_dir, "model.joblib"))

    metrics = {
        "version": version,
        "records_used": int(len(frame)),
        "train_size": int(len(x_train)),
        "test_size": int(len(x_test)),
        "labels": sorted(frame["category"].unique().tolist()),
        "accuracy": float(accuracy),
        "macro_f1": float(macro_f1),
        "classification_report": report,
    }

    with open(os.path.join(out_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    x_test_out = pd.DataFrame({"transaction_description": x_test, "category": y_test})
    x_test_out.to_parquet(os.path.join(out_dir, "test_split.parquet"), index=False)

    print(json.dumps({"status": "ok", "artifact_dir": out_dir, "accuracy": accuracy, "macro_f1": macro_f1}, indent=2))


if __name__ == "__main__":
    main()
