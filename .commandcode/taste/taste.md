# Taste

## Communication
- Communicates in casual, colloquial Malay ("bro") and expects replies in Malay. Confidence: 0.85
- Gives terse, compressed directives that name only the trigger and the target (e.g. "siapkan", "backend dah siap, siapkan module auth") — often right after being asked an open design question — and expects the agent to work out the scope itself, make a reasonable judgment call on the ambiguity, and flag it for correction rather than blocking on a clarifying question. Confidence: 0.6

## Workflow
- When checking contract alignment, prefers the agent to read the source code (git branch/working tree) rather than probing deployed servers — assumes deployments may lag behind the code. Confidence: 0.7
- Treats source-of-truth as the code on the relevant git branch (e.g. in-progress work lives on `development`, not the deployed `staging`). Confidence: 0.6
- Judges a module "done" by contract coverage, not vibes: expects the agent to audit that every backend route/endpoint has a frontend caller before answering, and asks terse status questions ("dah siap ke semua?") that require an actual inventory rather than recollection. Confidence: 0.55
