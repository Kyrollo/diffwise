# DiffWise Evaluation & Benchmark Harness

This document describes the reproducible evaluation methodology, metrics, and Service Level Agreement (SLA) verification for DiffWise.

---

## 1. Running the Benchmark

Ensure local Ollama GPU is running warm at `http://127.0.0.1:11434` with model `qwen2.5:0.5b`:

```bash
cd e:\Jobs\projects\diffwise
python evaluation/harness/runner.py
```

Outputs generated:
- `evaluation/reports/latest_eval.json`: Raw telemetry data.
- `evaluation/reports/pr_review_metrics.svg`: Metric visualization card.
- `evaluation/reports/report.md`: Markdown summary.

---

## 2. Benchmark Metrics & SLA Targets

| Benchmark Phase | Target SLA | Measured Baseline | Result |
| :--- | :--- | :--- | :--- |
| **Diff Parser Latency** | < 5,000 µs | **116.2 µs** | PASS |
| **Rule Linter Latency** | < 2,000 µs | **589.1 µs** | PASS |
| **Gate Accuracy** | Deterministic block on CRITICAL | **100% BLOCKED** | PASS |
| **Local GPU PR Review** | < 10,000 ms | **3,900 ms** | PASS |
| **Risk Score Calibration** | 0 to 100 range | **90 / 100** | PASS |

---

## 3. Zero-Simulation Enforcement

DiffWise strictly bans simulated, fake, or mock implementations. Validate at any time:

```bash
python e:\Jobs\shared\foundation\scripts\check_no_simulation.py -p e:\Jobs\projects\diffwise
```
