# Google Sheets Integration Setup Guide

## Quick Start

To enable Google Sheets integration, follow these steps:

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "NEW PROJECT"
4. Name it (e.g., "Card Generator")
5. Click "CREATE"

### 2. Enable Required APIs

1. In the left sidebar, go to **"APIs & Services" > "Library"**
2. Search for and enable:
   - **Google Sheets API**
   - **Google Drive API**

### 3. Create API Key

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Copy the API key that appears
5. (Optional) Click "RESTRICT KEY" to add security:
   - Under "API restrictions", select "Restrict key"
   - Select only "Google Sheets API" and "Google Drive API"
6. Save

### 4. Create OAuth Client ID

1. Still in **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS"** again
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen:
   - Choose "External"
   - Fill in app name: "Card Generator"
   - Add your email as user support and developer contact
   - Click "SAVE AND CONTINUE"
   - Skip scopes (click "SAVE AND CONTINUE")
   - Add test users (your own email) under "Test users"
   - Click "SAVE AND CONTINUE"
5. Back to creating OAuth client ID:
   - Application type: **"Web application"**
   - Name: "Card Generator Web Client"
   - **Authorized JavaScript origins**: Add your URLs:
     - For local development: `http://localhost:5173` (if using Vite)
     - For production: `https://yourusername.github.io` (your GitHub Pages URL)
   - Click "CREATE"
6. Copy the **Client ID** that appears (looks like: `xxxxx.apps.googleusercontent.com`)

### 5. Update app.js with Your Credentials

Open `app.js` and find lines 9-10:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'YOUR_API_KEY_HERE';
```

Replace with your actual values:

```javascript
const GOOGLE_CLIENT_ID = '123456789-abcdefg.apps.googleusercontent.com'; // Your actual Client ID
const GOOGLE_API_KEY = 'AIzaSyABC123DEF456GHI789'; // Your actual API Key
```

### 6. Test Locally

1. Run the development server: `npm run dev`
2. Open the app in your browser
3. Click "Sign in with Google"
4. You should see the Google sign-in popup

### 7. Deploy to GitHub Pages

1. Make sure your GitHub Pages URL is added to "Authorized JavaScript origins" in Google Cloud Console
2. Commit and push your changes
3. Run: `npm run deploy`
4. Visit your GitHub Pages site and test the Google Sign-In

## Troubleshooting

### "Google API Error"
- Check that both APIs are enabled in Google Cloud Console
- Verify your API key is correct in `app.js`
- Check browser console for specific error messages

### "Sign in failed" or redirect issues
- Make sure your current URL is in "Authorized JavaScript origins"
- For local dev, use `http://localhost:5173` (not `127.0.0.1` or `file://`)
- For production, use your exact GitHub Pages URL

### "Access blocked: This app's request is invalid"
- Your OAuth consent screen needs to be configured
- Make sure you added yourself as a test user
- The app doesn't need to be verified for personal use

### Sign-in button stays disabled
- Open browser console and check for errors
- Make sure the Google API scripts are loading (check Network tab)
- Verify your credentials are set in `app.js`

## Security Notes

- Your API Key will be visible in the client-side code - this is normal for client-side Google APIs
- The API Key should be restricted to only the APIs you need (Sheets + Drive)
- For production, consider adding HTTP referrer restrictions to your API key
- OAuth Client ID is safe to be public as it requires user consent

## Example Spreadsheet Format

Your Google Sheets should have the same columns as the CSV format:

| name | troopCost | manaCost | playableOn | type | cardText | flavorText | power | toughness | range | image | artist |
|------|-----------|----------|------------|------|----------|------------|-------|-----------|-------|-------|--------|
| Dragon | 5 | 3 | mountain,wasteland | Troop - Dragon | Flying, Fire breath | Ancient and powerful | 6 | 6 | | dragon.png | Artist Name |
