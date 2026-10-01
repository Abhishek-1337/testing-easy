# Testing Easy

Static site of step-by-step testing integration guides, hosted on GitHub Pages.

## Adding a guide

1. Create `guides/<slug>.md`.
2. Add an entry to `guides/index.json`:
   ```json
   { "slug": "<slug>", "title": "<Title>", "file": "<slug>.md", "description": "<one line>" }
   ```
3. Optionally put a one-line summary under each `##` heading as an HTML comment. It shows in the guide's "On this page" box and is hidden in the guide itself:
   ```markdown
   ## Test 1: Preferences are per user today
   <!-- Each user has their own notification switches; practices have none. -->
   ```
4. Commit and push — GitHub Pages redeploys automatically.

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
