# Dashain Wishes (static, no database)

Visitors upload their photo and type their name and designation; the greeting image is
made in their own browser and they download it. No server, no database, no login.

- `index.html`  – page for visitors
- `admin.html`  – your template builder (place photo / name / designation by clicking)
- `templates.json` + `templates/` – list of designs and their images
- `wish.js`, `style.css` – shared code and styling

## Publish (GitHub + Vercel, free)
1. Create a Public repo on github.com.
2. **Add file -> Upload files**: drag in everything from this folder (keep the `templates` folder). Commit.
3. vercel.com -> sign in with GitHub -> Add New -> Project -> pick the repo.
   Framework Preset: **Other**, Build Command empty, **Deploy**.

## Add / change a design
1. Open `https://your-site/admin.html`, choose your design image.
2. Click Photo / Name / Designation, then click on the image where each should go. Adjust size/colour.
3. **Save to list**, then **Download templates.json** and the **Image** button of a new design.
4. On GitHub: `templates.json` goes in the MAIN folder (replace old one), the image goes in the
   `templates` folder. Image filename must match exactly (lowercase). Vercel updates in ~30 seconds.

## Test on your computer
Run `python -m http.server` inside this folder and open http://localhost:8000
(double-clicking index.html will not load templates.json).
