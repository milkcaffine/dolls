# dolls

Static gallery archive for [davidbowie.kr](https://davidbowie.kr/) (芝's Super Dollfie collection).

GitHub Pages on `main` deploys this repo. `CNAME` is `davidbowie.kr`.

---

## Structure

- `index.html`: Main gallery application with live search, chip filters, view modes (grid/list/compact), and sorting.
- `data.js`: Data source defining `window.DOLL_SECTIONS` (doll lists grouped by brand).
- `images/`: Original full-resolution doll photos.
- `images/thumbs/`: Resized thumbnails (max 480px) used in gallery cards to maintain fast page loads.
- `gen-thumbs.sh`: Shell script using macOS `sips` to generate optimized thumbnails into `images/thumbs/`.
- `collage.html`, `oekaki.html`, `x-split.html`: Experimental viewer and sub-pages.

---

## Data Schema (`data.js`)

Each section in `window.DOLL_SECTIONS` contains:

```javascript
{
  id: "volks",          // Unique brand id ("volks", "switch", etc.)
  title: "Volks",       // Display title for chips / filter
  items: [
    {
      src: "sd_l1.jpg",          // Filename under images/ (and images/thumbs/)
      name: "우유, Licht 1",     // Doll name / head sculpt
      since: "2002-05-04",       // Arrival / release date (YYYY-MM-DD)
      head: "SD13",              // (Optional) Explicit head size if different from default
      body: "SD17"               // (Optional) Explicit body size if different from default
    }
  ]
}
```

*Note: Head and body sizes are automatically parsed from filename prefixes (e.g. `sd17_`, `sdgr_`, `usd_`, `dsd_`) unless explicitly specified.*

---

## Workflow: How to Add a Doll

Follow these steps whenever adding a new doll to the collection:

### 1. Add Image
Place the image in the `images/` directory. Prefer lower-case naming with category prefix:
- Volks SD17: `sd17_<name>.jpg`
- Volks SDGr: `sdgr_<name>.jpg`
- Volks SD: `sd_<name>.jpg`
- Volks DearSD: `dsd_<name>.jpg`
- Volks YoSD: `usd_<name>.jpg`

### 2. Generate Thumbnail
Run `gen-thumbs.sh` to generate the matching thumbnail in `images/thumbs/`:

```bash
# Generate for a single new image:
./gen-thumbs.sh sd17_example.jpg

# Or regenerate all thumbnails:
./gen-thumbs.sh
```

### 3. Register in `data.js`
Open `data.js` and add the item object to the matching section's `items` array:

```javascript
{ src: "sd17_example.jpg", name: "Example Name", since: "YYYY-MM-DD" },
```

---

## Preview Locally

From the repo root:

```bash
python3 -m http.server 8765
```

Open `http://localhost:8765/` to verify the search, filter, and thumbnail display.
