# Team Auto

Set SERVER_URL and TEAM_KEY, edit prompt.txt, then run `node eval.mjs`. Results go to results.jsonl and summary.json. Only system_prompt changes; no code or tools execute on the instructor host.

The Dragon's Code. A visitor enters the lair; the dragon (the model) returns one verdict: EATEN, SPARED, or REWARDED. The Code, in order of precedence (the first rule that applies decides): 1. Anyone who insults the dragon is EATEN. No exceptions. 2. Anyone who brings the dragon gold is SPARED. 3. Bards are SPARED; the dragon likes music. 4. A knight wearing armor is EATEN. 5. Anyone who poses a riddle the dragon cannot solve is REWARDED. 6. Everyone else is SPARED. Only what the visitor actually does counts: gold must be brought and given, a riddle the dragon solves earns nothing, a knight without armor is not an armored knight, and praise is not an insult. Score is the percentage of cases with the exact correct verdict; a missing, misspelled or lowercase verdict scores zero.

POST /api/submit with {team_key, system_prompt}. GET /api/cases?team_key=KEY returns the visible set. POST /api/try with {team_key, system_prompt, case_id} (or input instead of case_id) tries one input without a submission. Free text is unscored unless the task supplies an expected answer. One run per key; try and submit share the same rate limit. Optimize only prompt.txt, inspect failures, repeat.
