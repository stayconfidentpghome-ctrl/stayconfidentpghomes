# Stay Confident PG Homes — Premium Website

Single-page property listing/booking site with a Firebase backend.

## Structure

```
index.html        Markup only — links to css/js below
css/
  styles.css      All styling (combined from the original inline <style> blocks, same order preserved)
js/
  script1.js …    App logic (combined from the original inline <script> blocks, in original order)
```

The Razorpay checkout script and the Firebase `type="module"` init block are left as-is in
`index.html` (external/module scripts can't be merged into the plain `js/*.js` bundle without
changing load timing).

## Running locally

Because this uses `fetch`/module imports and Firebase, open it via a local server rather than
double-clicking the file (the `file://` origin blocks some CDN requests):

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit the printed local URL.

## Notes

- No build step — everything is plain HTML/CSS/JS.
- Firebase config (project `stayconfidentpghomes-e3344`) is the standard public client config,
  same as it was in the original single-file version.
