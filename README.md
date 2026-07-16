# Stay Confident PG Homes — Website

A single-file static website (all HTML, CSS and JS live in `index.html` — no build step needed).

## How to upload to GitHub

1. Create a new repository on GitHub (e.g. `stay-confident-pg-homes`).
2. Upload `index.html` (and this `README.md`, optional) to the root of the repository — either via
   "Add file → Upload files" on github.com, or with git:
   ```
   git init
   git add index.html README.md
   git commit -m "Initial site upload"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. To make it live for free with **GitHub Pages**:
   - Go to the repository → **Settings → Pages**.
   - Under "Build and deployment", set **Source: Deploy from a branch**.
   - Branch: `main`, folder: `/ (root)` → **Save**.
   - GitHub will give you a live URL like `https://<your-username>.github.io/<your-repo>/` within a minute or two.

## Important note about saved data (admin edits, bookings, pricing, etc.)

This site currently saves data to the visitor's own browser (`localStorage`) once it's hosted outside
of Claude.ai. That means:
- Reloading the page on the **same** browser/device keeps your changes — the "reset to defaults on
  reload" bug is fixed.
- Admin edits made on **one** device (e.g. your phone) will **not** automatically appear for a
  customer browsing on a **different** device/browser, since there's no shared server database yet.

If you want every visitor, on every device, to always see the same live room availability / pricing /
admin settings, the site needs a small real backend (e.g. Firebase, Supabase, or a simple database-
backed API). That's a separate step from the GitHub upload — happy to help set that up whenever you're
ready.
