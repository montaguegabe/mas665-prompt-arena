# Instructions for coding agents

- The only file you may edit to improve the score is `prompt.txt`. `eval.mjs`, `cases.json` and the scoring server are the harness; the server ignores anything else.
- Run the eval with `node eval.mjs` (needs `SERVER_URL` and `TEAM_KEY` in the environment). Per-case transcripts and grades land in `results.jsonl`; the headline score is in `summary.json`.
- One change per round. Keep it only if the score improves. Log each round's prompt and score.
- Respect the server's rate limit; do not run evals in parallel.
