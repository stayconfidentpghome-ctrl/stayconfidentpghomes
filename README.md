# Stay Confident PG Homes — Room Availability & Booking

A static website (HTML/CSS/JS) backed by Firebase (Firestore + Analytics) for
room availability, bed selection, enquiries, and Razorpay-based payment
collection.

## Project structure

```
stay-confident-pg/
├── index.html          # Main page (markup only)
├── css/
│   └── style.css       # All styles (extracted from the original single file)
├── js/
│   ├── script.js        # App logic: rendering, pricing, preferences,
│   │                     # payment, admin settings, animations, UX polish
│   └── firebase-config.js  # Firebase initialization (ES module)
├── firebase.json        # Firebase Hosting config
├── .firebaserc           # Firebase project alias
└── README.md
```

The original file was a single ~4,300-line HTML document with inline
`<style>` and `<script>` blocks. It has been split here into standard
static-site files with no change in behavior — CSS is combined in the same
order it originally appeared (so cascade/specificity is unaffected), and all
classic `<script>` blocks are combined into `js/script.js` in their original
order, loaded right before `</body>`. The Firebase initialization keeps its
`type="module"` and lives in its own file, `js/firebase-config.js`.

## Local preview

Because `js/firebase-config.js` is loaded as an ES module, opening
`index.html` directly via `file://` will fail (CORS). Serve it over HTTP
instead, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080` (or the port shown).

## Deploying

### Option A — GitHub Pages
1. Push this folder to a GitHub repository (see "Git setup" below).
2. In the repo settings, enable **GitHub Pages** for the `main` branch
   (root folder).
3. Your site will be live at `https://<username>.github.io/<repo>/`.

### Option B — Firebase Hosting (recommended, since Firestore is already used)
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```
This uses the included `firebase.json` and `.firebaserc`, which are already
pointed at the `stayconfidentpghomes-e3344` Firebase project referenced in
`js/firebase-config.js`.

## Git setup

```bash
cd stay-confident-pg
git init
git add .
git commit -m "Initial commit: split monolithic HTML into html/css/js + Firebase"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Notes / things worth reviewing before going live

- **Firebase config is public by design** — the `apiKey` etc. in
  `js/firebase-config.js` are not secrets; access is controlled by your
  **Firestore security rules**, not by hiding this file. Double-check your
  rules in the Firebase console before launch.
- **Razorpay Key ID** is entered via an admin panel in the page and stored
  client-side; this only opens the Razorpay checkout popup and does **not**
  verify payments server-side. Cross-check payments in your Razorpay
  dashboard, and consider adding a Cloud Function to verify payment
  signatures for production use.
- **Admin PIN** is also handled client-side (in `js/script.js`) — fine for a
  low-stakes deterrent, but not a substitute for real authentication if this
  ever needs to be more secure.
