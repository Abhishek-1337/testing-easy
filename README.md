# Testing Easy

Static site of step-by-step testing integration guides, hosted on GitHub Pages.

## Adding a guide

1. Create `guides/<slug>.md`.
2. Add an entry to `guides/index.json`:
   ```json
   { "slug": "<slug>", "title": "<Title>", "file": "<slug>.md", "description": "<one line>" }
   ```
3. Commit and push — GitHub Pages redeploys automatically.

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
