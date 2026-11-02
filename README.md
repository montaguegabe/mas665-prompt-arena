# MAS.665 Prompt Arena: starter

Your job is to write the system prompt for a small model (gemma3:1b) that routes a user request to the right tool and fills in its arguments. The scoring server owns everything else: the model, temperature 0, JSON mode, the message template that wraps the tool list and the request, and the scorer. The only thing you can change is `prompt.txt`.

## Setup

Node 18 or newer, no dependencies.

```sh
git clone https://github.com/montaguegabe/mas665-prompt-arena.git
cd mas665-prompt-arena
export SERVER_URL=<the arena URL from the slide>
export TEAM_KEY=<your team key from the board>
node eval.mjs                 # submits prompt.txt, prints the score and the failing cases
node eval.mjs other.txt       # submit a different prompt file
```

Outputs:

- `results.jsonl`: one line per case with `{id, tags, request, expected, output, transcript, model, usage, grade}`. `transcript.messages` is the exact system and user message pair sent to the model and `transcript.raw_reply` is the model's raw output. `grade` has `score`, `tool_correct`, `arg_f1` and a per-key breakdown.
- `summary.json`: score, failing case ids, mean score per tag, the submission id and the prompt hash.
- `cases.json`: the 60 visible cases with the tool list, so you can read them without hitting the server.

Server time is about 8 seconds for 60 cases the first time a prompt is seen (a few seconds more if the other team is running at the same moment) and instant for a prompt the server has already scored (cached by model + prompt + case). There is a per-team rate limit and one run at a time per team, so batch your thinking, not your submissions.

## API

```
GET  /api/cases?team_key=KEY        visible cases + manifest + the locked template
POST /api/submit                    { team_key, system_prompt } -> { score, per_case: [...] }
GET  /api/submissions/:id?team_key=KEY
GET  /api/leaderboard
```

Scoring per case: wrong tool is 0; right tool is `0.6 + 0.4 * F1(argument keys)`, where a key listed in the case's `strict` list only counts if its value matches too (case-insensitive, whitespace-normalized); cases whose expected tool is `none` score 1 only for `{"tool": "none"}`. The headline number is the mean over the 60 visible cases as a percentage.

## Hill climbing with Claude Code (Anthropic's eval-hillclimb guide)

The guide is at <https://github.com/anthropics/skills/blob/main/skills/claude-api/shared/evals/eval-hillclimb.md>. It runs rounds of: analyze the failing transcripts, propose exactly one change, apply it, re-run, keep or revert. Point Claude Code at this folder and give it the guide with the following scope:

- **Scope table: `prompt.txt` only.** Say so explicitly. The guide lets you choose what the optimizer may edit (system prompt, tool descriptions, model parameters, harness code); here the only editable file is `prompt.txt`. `eval.mjs`, `cases.json` and the server are the harness, and the server would ignore changes to them anyway.
- **Eval command:** `node eval.mjs`. **Transcripts:** `results.jsonl` (one JSON object per case with `transcript`, `model`, `usage`, `grade`, which is the per-case shape the guide expects). **Headline metric:** `score` in `summary.json`.
- Do the guide's **train/test split** on `cases.json` yourself (stratify by `tags`, never by baseline score), read only the train failures when proposing a change, and report the test split in your notes. Keep the noise floor in mind: with 60 cases, one case is 1.7 points.
- One change per round. Record each round's prompt and score. Revert anything that lifts train but not test.

A fast first loop by hand: `node eval.mjs`, read the failures it prints, change one thing in `prompt.txt`, run again.

## GEPA (optional)

GEPA (`pip install gepa`, or `dspy.GEPA`) is a reflective prompt optimizer: it runs your candidate prompt on training cases, reads the execution traces plus textual feedback from the metric, has a reflection LLM propose a mutated prompt, and keeps a Pareto frontier of candidates. To use it here, write a metric that POSTs a candidate prompt to `/api/submit` and returns, for each case, both the score and a short text explaining the failure (for example "expected timer.set, got weather.get" or "missing key: label"). The metric **must return textual feedback, not just a number**: GEPA's whole mechanism is reflection over that text. Pass `trainset` and `valset` split from `cases.json`, let it run for a bounded number of rollouts (the server rate limit applies; batch cases per submission since each submission scores the full visible set), and submit the best candidate's text as `prompt.txt`. The `gepa` README has an `optimize_anything` example that takes a plain string parameter, which is exactly this situation.
