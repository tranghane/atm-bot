#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


def resolve_artifact_dir(artifact_dir: str | None, artifacts_root: str) -> Path:
    if artifact_dir:
        target = Path(artifact_dir)
        if not target.exists() or not target.is_dir():
            raise FileNotFoundError(f"Artifact directory not found: {artifact_dir}")
        return target

    root = Path(artifacts_root)
    if not root.exists() or not root.is_dir():
        raise FileNotFoundError(f"Artifacts root not found: {artifacts_root}")

    candidates = [p for p in root.iterdir() if p.is_dir()]
    if not candidates:
        raise FileNotFoundError(f"No artifact directories found under: {artifacts_root}")

    return max(candidates, key=lambda p: p.stat().st_mtime)


def run_cmd(args: list[str]) -> None:
    result = subprocess.run(args)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(args)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run Phase C flow: evaluate + quality gate for latest artifact"
    )
    parser.add_argument("--artifact-dir", default=None)
    parser.add_argument("--artifacts-root", default="scripts/ml/artifacts")
    parser.add_argument("--min-accuracy", type=float, default=0.95)
    parser.add_argument("--min-macro-f1", type=float, default=0.95)
    parser.add_argument("--min-recall", type=float, default=0.90)
    args = parser.parse_args()

    artifact_dir = resolve_artifact_dir(args.artifact_dir, args.artifacts_root)

    evaluate_cmd = [
        sys.executable,
        "scripts/ml/evaluate.py",
        "--artifact-dir",
        str(artifact_dir),
    ]
    quality_cmd = [
        sys.executable,
        "scripts/ml/quality_gate.py",
        "--artifact-dir",
        str(artifact_dir),
        "--min-accuracy",
        str(args.min_accuracy),
        "--min-macro-f1",
        str(args.min_macro_f1),
        "--min-recall",
        str(args.min_recall),
    ]

    run_cmd(evaluate_cmd)
    run_cmd(quality_cmd)

    with open(artifact_dir / "quality_gate.json", "r", encoding="utf-8") as f:
        quality = json.load(f)

    output = {
        "artifact_dir": str(artifact_dir),
        "passed": bool(quality.get("passed", False)),
        "thresholds": quality.get("thresholds", {}),
        "actual": quality.get("actual", {}),
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
