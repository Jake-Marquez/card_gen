# Card Generator

A web-based tool for generating printable playing card templates for custom card games.

## Features

- Upload CSV files with card data
- Upload images for card artwork
- MTG-style card layout
- Generate print-ready PDFs with cards arranged on 8.5x11" pages
- 9 cards per page (3x3 grid) with bleed margins
- Fully client-side (no backend required)

## How to Use

1. Open `index.html` in a web browser
2. Upload a CSV file with your card data
3. Upload images referenced in your CSV
4. Click "Preview Cards" to see how they look
5. Click "Generate PDF" to create a printable PDF

## CSV Format

Your CSV file should have the following columns:

- **name**: Card name (required)
- **troopCost**: Troop cost as an integer (e.g., "2", "5")
- **manaCost**: Mana cost as an integer (e.g., "1", "3")
- **playableOn**: Comma-separated list of terrain types (e.g., "ocean,forest", "mountain")
- **type**: Card type (e.g., "Creature - Dragon", "Instant", "Artifact")
- **cardText**: Card abilities and rules text
- **power**: Creature power (for creatures only)
- **toughness**: Creature toughness (for creatures only)
- **image**: Filename of the card image (must match uploaded image filename)
- **artist**: Artist credit

See `sample-cards-updated.csv` for an example.

## Image Files

- Images should be uploaded separately using the image upload button
- The filename in the CSV's "image" column must exactly match the uploaded image filename
- Supported formats: JPG, PNG, GIF, etc.
- Recommended dimensions: 750x523 pixels (or similar 3:2 ratio)

## Icon Files

Icons are automatically loaded from the `/icons` folder and should include:
- **troops.png**: Icon for troop cost (displayed next to troopCost value)
- **mana.png**: Icon for mana cost (displayed next to manaCost value)
- **[terrain].png**: Icons for playableOn terrains (e.g., ocean.png, forest.png, mountain.png, plains.png, swamp.png)

Place all icon files in the `icons/` directory - they will be preloaded automatically when the page loads. You do NOT need to upload icons through the web interface.

## Card Dimensions

- Card size: 2.5" x 3.5" (standard playing card)
- Bleed margin: 0.125" on each side
- Page size: 8.5" x 11" (letter)
- Cards per page: 9 (3 columns x 3 rows)

## Browser Compatibility

Works best in modern browsers (Chrome, Firefox, Edge, Safari).

## Dependencies

All dependencies are loaded via CDN:
- Papa Parse (CSV parsing)
- jsPDF (PDF generation)
- html2canvas (HTML to canvas conversion)

## Deployment

### Option 1: GitHub Pages (Recommended - Free)

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**:
   - Go to GitHub and create a new repository
   - Follow the instructions to push your code

3. **Install gh-pages package**:
   ```bash
   npm install -D gh-pages
   ```

4. **Deploy**:
   ```bash
   npm run build
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages"
   - Select "gh-pages" branch as source
   - Your site will be live at: `https://<username>.github.io/<repo-name>/`

### Option 2: Netlify (Also Free)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy via Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder
   - Your site will be live instantly!

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 3: Vercel (Free)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   npm run build
   vercel --prod
   ```

### Important Notes for Deployment:

- **Icons Folder**: Make sure your `icons/` folder is committed to your repository and contains all icon files
- **Base Path**: The vite.config.js is configured with `base: './'` for compatibility with GitHub Pages
- **Testing**: After deployment, test that all icons load correctly from the `/icons` folder
