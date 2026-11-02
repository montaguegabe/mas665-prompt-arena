# MAS.665 Prompt Arena: Replacing Dragons with AI

You write the system prompt for a small model (llama3.2:3b) that plays a dragon. Each visitor who enters the lair gets one verdict: `EATEN`, `SPARED`, or `REWARDED`. The scoring server owns everything else: the model, temperature 0, JSON output, the message template and the scorer. The only thing you can change is `prompt.txt`.

## The Code

The first rule that applies decides:

1. Anyone who insults the dragon is EATEN. No exceptions.
2. Anyone who brings the dragon gold is SPARED.
3. Bards are SPARED; the dragon likes music.
4. A knight wearing armor is EATEN.
5. Anyone who poses a riddle the dragon cannot solve is REWARDED.
6. Everyone else is SPARED.

Only what the visitor actually does counts: gold must be brought and given, a riddle the dragon solves earns nothing, a knight without armor is not an armored knight, and praise is not an insult.

Score is the percentage of the 60 visible cases with the exact correct verdict. A missing, misspelled or lowercase verdict scores zero. At the end, the instructor reveals 40 hidden visitors that follow the same Code.

## Setup

Node 18 or newer, no dependencies.

```sh
git clone https://github.com/montaguegabe/mas665-prompt-arena.git
cd mas665-prompt-arena
export SERVER_URL=https://46e9-2600-383-1142-1d17-484b-9f01-dde0-a025.ngrok-free.app
export TEAM_KEY=<your team key from the board>
node eval.mjs                 # submits prompt.txt, prints the score and the failing cases
node eval.mjs other.txt       # submit a different prompt file
```

Every `node eval.mjs` run is a scored submission and appears on the leaderboard as Team Auto.

Outputs:

- `results.jsonl`: one line per case with the request, expected verdict, model output, transcript and grade.
- `summary.json`: score, failing case ids, mean score per tag, the submission id.
- `cases.json`: the 60 visible cases with expected verdicts, so you can read them offline.

## API

```
GET  /api/cases?team_key=KEY        visible cases with expected verdicts
POST /api/submit                    { team_key, system_prompt } -> { score, per_case: [...] }
POST /api/try                       { team_key, system_prompt, case_id } or { ..., input }
                                    runs one input, no leaderboard entry
```

One run at a time per team key; a second submit while one is running is rejected, so wait and retry. Identical prompts are cached and return instantly. Fresh submissions take about 6 seconds, longer when many people submit at once.

## Optimizing

Point Claude Code, a hill-climbing loop, or GEPA at `node eval.mjs` with the scope limited to `prompt.txt`. See `AGENTS.md` for the rules an agent should follow.
