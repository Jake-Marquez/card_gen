// Global state
let cardData = [];
let imageMap = {};
let iconMap = {};
let accessToken = null;

// Google API Configuration
// IMPORTANT: Replace this with your actual Google Cloud Project Client ID
const GOOGLE_CLIENT_ID = '83506289505-c5mhe4t5ig734tav216iqd15bqmtevpo.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDq6q2590vojpqy50REynuollRV2Z650d8';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly';

// DOM elements
const csvUpload = document.getElementById('csv-upload');
const imageUpload = document.getElementById('image-upload');
const generateBtn = document.getElementById('generate-btn');
const previewBtn = document.getElementById('preview-btn');
const csvStatus = document.getElementById('csv-status');
const imageStatus = document.getElementById('image-status');
const cardPreview = document.getElementById('card-preview');
const previewSection = document.getElementById('preview-section');
const printArea = document.getElementById('print-area');

// Google Sheets DOM elements
const googleSignInBtn = document.getElementById('google-signin-btn');
const googleSignOutBtn = document.getElementById('google-signout-btn');
const googleSheetsContainer = document.getElementById('google-sheets-container');
const sheetsSelect = document.getElementById('sheets-select');
const loadSheetBtn = document.getElementById('load-sheet-btn');
const googleStatus = document.getElementById('google-status');
const userEmail = document.getElementById('user-email');

// Preload icons from icons folder
async function preloadIcons() {
    const iconNames = [
        'troops.png',
        'mana.png',
        'range.png',
        'forest.png',
        'plains.png',
        'mountain.png',
        'ocean.png',
        'swamp.png',
        'island.png',
        'desert.png',
        'tundra.png',
        'jungle.png',
        'wasteland.png',
        'chaos.png',
        'card_frame1.png'
    ];

    const promises = iconNames.map(async (iconName) => {
        try {
            const response = await fetch(`./icons/${iconName}`);
            if (response.ok) {
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        iconMap[iconName] = e.target.result;
                        console.log('Preloaded icon:', iconName);
                        resolve();
                    };
                    reader.readAsDataURL(blob);
                });
            } else {
                console.log(`Icon ${iconName} failed to load: ${response.status}`);
            }
        } catch (error) {
            console.log(`Icon ${iconName} not found:`, error.message);
        }
    });

    await Promise.all(promises);
    console.log('All icons loaded:', Object.keys(iconMap));
}

// Load icons on page load and initialize test card after
preloadIcons().then(() => {
    // Initialize test card after icons are loaded
    if (document.getElementById('test-card-display')) {
        updateTestCard();
    }
});

// Google Sheets API Functions
let tokenClient;
let gapiInited = false;
let gisInited = false;

// Initialize Google API - exposed globally immediately
window.gapiLoaded = function() {
    if (typeof gapi === 'undefined') {
        console.error('Google API (gapi) failed to load');
        return;
    }
    gapi.load('client', initializeGapiClient);
};

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing Google API client:', error);
        if (googleSignInBtn) {
            const textSpan = document.getElementById('google-signin-text');
            if (textSpan) {
                textSpan.textContent = 'Google API Error (Check Console)';
            }
        }
    }
}

// Initialize Google Identity Services - exposed globally immediately
window.gisLoaded = function() {
    if (typeof google === 'undefined') {
        console.error('Google Identity Services (google) failed to load');
        return;
    }
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: '', // defined later
        });
        gisInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing Google Identity Services:', error);
    }
};

function maybeEnableButtons() {
    if (gapiInited && gisInited && googleSignInBtn) {
        googleSignInBtn.disabled = false;
        const textSpan = document.getElementById('google-signin-text');
        if (textSpan) {
            textSpan.textContent = 'Sign in with Google';
        }
    }
}

// Handle Google Sign In
function handleGoogleSignIn() {
    if (!gapiInited || !gisInited) {
        showStatus(googleStatus, 'error', 'Google API is still loading. Please wait...');
        return;
    }

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            showStatus(googleStatus, 'error', 'Authentication failed');
            throw (resp);
        }

        const token = gapi.client.getToken();
        accessToken = token ? token.access_token : null;

        // Get user info
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const userInfo = await response.json();
            userEmail.textContent = userInfo.email;
        } catch (error) {
            console.error('Error fetching user info:', error);
        }

        googleSignInBtn.style.display = 'none';
        googleSheetsContainer.style.display = 'block';
        showStatus(googleStatus, 'success', 'Signed in successfully!');

        // Load spreadsheets
        await loadSpreadsheetsList();
    };

    const existingToken = gapi.client.getToken();
    if (existingToken === null || existingToken === undefined) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Handle Google Sign Out
function handleGoogleSignOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
    googleSignInBtn.style.display = 'block';
    googleSheetsContainer.style.display = 'none';
    sheetsSelect.innerHTML = '<option value="">Select a spreadsheet...</option>';
    loadSheetBtn.disabled = true;
    accessToken = null;
    showStatus(googleStatus, 'success', 'Signed out successfully');
}

// Load list of spreadsheets
async function loadSpreadsheetsList() {
    try {
        showStatus(googleStatus, 'success', 'Loading spreadsheets...');

        const response = await gapi.client.request({
            path: 'https://www.googleapis.com/drive/v3/files',
            params: {
                q: "mimeType='application/vnd.google-apps.spreadsheet'",
                orderBy: 'modifiedTime desc',
                pageSize: 100,
                fields: 'files(id, name)'
            }
        });

        const files = response.result.files;
        sheetsSelect.innerHTML = '<option value="">Select a spreadsheet...</option>';

        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.id;
            option.textContent = file.name;
            sheetsSelect.appendChild(option);
        });

        showStatus(googleStatus, 'success', `Found ${files.length} spreadsheets`);
    } catch (error) {
        console.error('Error loading spreadsheets:', error);
        showStatus(googleStatus, 'error', 'Failed to load spreadsheets');
    }
}

// Load selected spreadsheet data
async function loadSelectedSheet() {
    const spreadsheetId = sheetsSelect.value;
    if (!spreadsheetId) return;

    try {
        loadSheetBtn.textContent = 'Loading...';
        loadSheetBtn.disabled = true;

        // Get the spreadsheet to find sheet names
        const metaResponse = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });

        // Use the first sheet
        const sheetName = metaResponse.result.sheets[0].properties.title;

        // Get the data from the first sheet
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!A:Z`, // Get all columns
        });

        const rows = response.result.values;
        if (!rows || rows.length === 0) {
            showStatus(googleStatus, 'error', 'No data found in spreadsheet');
            return;
        }

        // Convert to card data format (assuming first row is headers)
        const headers = rows[0];
        cardData = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const card = {};
            headers.forEach((header, index) => {
                card[header] = row[index] || '';
            });
            // Only include rows with a name
            if (card.name && card.name.trim() !== '') {
                cardData.push(card);
            }
        }

        console.log('Loaded card data from Google Sheets:', cardData);
        showStatus(googleStatus, 'success', `Loaded ${cardData.length} cards from sheet`);
        updateButtonStates();

    } catch (error) {
        console.error('Error loading sheet data:', error);
        showStatus(googleStatus, 'error', 'Failed to load sheet data');
    } finally {
        loadSheetBtn.textContent = 'Load Selected Sheet';
        loadSheetBtn.disabled = false;
    }
}

// Event listeners
csvUpload.addEventListener('change', handleCSVUpload);
imageUpload.addEventListener('change', handleImageUpload);
generateBtn.addEventListener('click', generatePDF);
previewBtn.addEventListener('click', showPreview);

// Google Sheets event listeners
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', handleGoogleSignIn);
}
if (googleSignOutBtn) {
    googleSignOutBtn.addEventListener('click', handleGoogleSignOut);
}
if (sheetsSelect) {
    sheetsSelect.addEventListener('change', () => {
        loadSheetBtn.disabled = !sheetsSelect.value;
    });
}
if (loadSheetBtn) {
    loadSheetBtn.addEventListener('click', loadSelectedSheet);
}

// Handle CSV upload
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            cardData = results.data.filter(card => card.name && card.name.trim() !== '');
            console.log('Parsed card data:', cardData);
            showStatus(csvStatus, 'success', `Loaded ${cardData.length} cards from CSV`);
            updateButtonStates();
        },
        error: function(error) {
            showStatus(csvStatus, 'error', `Error parsing CSV: ${error.message}`);
        }
    });
}

// Handle image upload (card artwork only)
function handleImageUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    let loadedCount = 0;
    imageMap = {};

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileName = file.name;
            imageMap[fileName] = e.target.result;
            console.log('Loaded card image:', fileName);
            loadedCount++;

            if (loadedCount === files.length) {
                showStatus(imageStatus, 'success', `Loaded ${loadedCount} card images`);
                updateButtonStates();
            }
        };
        reader.readAsDataURL(file);
    });
}

// Show status message
function showStatus(element, type, message) {
    element.className = `status ${type}`;
    element.textContent = message;
}

// Update button states
function updateButtonStates() {
    const hasData = cardData.length > 0;
    console.log('Updating button states - hasData:', hasData, 'cardData.length:', cardData.length);
    generateBtn.disabled = !hasData;
    previewBtn.disabled = !hasData;
}

// Helper function to get icon image
function getIconImage(iconName) {
    // Try different possible filenames
    const possibleNames = [
        iconName,
        `icons/${iconName}`,
        `${iconName}.png`,
        `icons/${iconName}.png`
    ];

    for (const name of possibleNames) {
        if (iconMap[name]) {
            console.log(`Found icon "${iconName}" as "${name}"`);
            return iconMap[name];
        }
    }
    console.log(`Icon "${iconName}" not found. Tried:`, possibleNames);
    console.log('Available icons:', Object.keys(iconMap));
    return null;
}

// Create a single card element
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    // Add troop class if type starts with "Troop"
    if (card.type && card.type.trim().toLowerCase().startsWith('troop')) {
        cardDiv.classList.add('card-troop');
    }

    // Add event class if type starts with "Event"
    if (card.type && card.type.trim().toLowerCase().startsWith('event')) {
        cardDiv.classList.add('card-event');
    }

    // Add card frame background image if available (layered on top of gradient)
    const cardFrame = iconMap['card_frame1.png'];
    if (cardFrame) {
        // Get the existing gradient from CSS class
        let gradient = 'linear-gradient(135deg, #f4e4c1 0%, #e8d4a8 100%)'; // default yellow
        if (card.type && card.type.trim().toLowerCase().startsWith('troop')) {
            gradient = 'linear-gradient(135deg, #d4f4d4 0%, #b8e8b8 100%)'; // green
        } else if (card.type && card.type.trim().toLowerCase().startsWith('event')) {
            gradient = 'linear-gradient(135deg, #f4d4d4 0%, #e8b8b8 100%)'; // red
        }
        // Layer the frame on top of the gradient
        cardDiv.style.backgroundImage = `url(${cardFrame}), ${gradient}`;
        cardDiv.style.backgroundSize = 'cover, cover';
        cardDiv.style.backgroundPosition = 'center, center';
    }

    // Card header with name, troop cost, and mana cost
    const header = document.createElement('div');
    header.className = 'card-header';

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = card.name || 'Unnamed Card';

    const costs = document.createElement('div');
    costs.className = 'card-costs';

    // Troop cost with icon
    if (card.troopCost) {
        const troopCostContainer = document.createElement('div');
        troopCostContainer.className = 'cost-item';

        const troopIcon = document.createElement('img');
        const troopIconSrc = getIconImage('troops.png') || getIconImage('troops');
        if (troopIconSrc) {
            troopIcon.src = troopIconSrc;
            troopIcon.className = 'cost-icon';
            troopIcon.alt = 'Troops';
            troopCostContainer.appendChild(troopIcon);
        }

        const troopValue = document.createElement('span');
        troopValue.textContent = card.troopCost;
        troopCostContainer.appendChild(troopValue);

        costs.appendChild(troopCostContainer);
    }

    // Mana cost with icon
    if (card.manaCost) {
        const manaCostContainer = document.createElement('div');
        manaCostContainer.className = 'cost-item';

        const manaIcon = document.createElement('img');
        const manaIconSrc = getIconImage('mana.png') || getIconImage('mana');
        if (manaIconSrc) {
            manaIcon.src = manaIconSrc;
            manaIcon.className = 'cost-icon';
            manaIcon.alt = 'Mana';
            manaCostContainer.appendChild(manaIcon);
        }

        const manaValue = document.createElement('span');
        manaValue.textContent = card.manaCost;
        manaCostContainer.appendChild(manaValue);

        costs.appendChild(manaCostContainer);
    }

    header.appendChild(name);
    if (card.troopCost || card.manaCost) {
        header.appendChild(costs);
    }

    cardDiv.appendChild(header);

    // Card image
    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    if (card.image && imageMap[card.image]) {
        const img = document.createElement('img');
        img.src = imageMap[card.image];
        img.alt = card.name;
        imageContainer.appendChild(img);
    } else {
        imageContainer.classList.add('no-image');
        imageContainer.textContent = 'No Image';
    }

    cardDiv.appendChild(imageContainer);

    // Card type with playableOn icons
    if (card.type) {
        const typeContainer = document.createElement('div');
        typeContainer.className = 'card-type-container';

        const type = document.createElement('div');
        type.className = 'card-type';
        type.textContent = card.type;
        typeContainer.appendChild(type);

        // Add playableOn icons or range (mutually exclusive)
        if (card.playableOn) {
            const playableOnContainer = document.createElement('div');
            playableOnContainer.className = 'playable-on-icons';

            const terrains = card.playableOn.split(',').map(t => t.trim()).filter(t => t);
            terrains.forEach(terrain => {
                const icon = document.createElement('img');
                const iconSrc = getIconImage(`${terrain}.png`) || getIconImage(terrain);
                if (iconSrc) {
                    icon.src = iconSrc;
                    icon.className = 'terrain-icon';
                    icon.alt = terrain;
                    playableOnContainer.appendChild(icon);
                }
            });

            typeContainer.appendChild(playableOnContainer);
        } else if (card.range) {
            // Range display (for creatures)
            const rangeContainer = document.createElement('div');
            rangeContainer.className = 'playable-on-icons';

            const rangeIcon = document.createElement('img');
            const rangeIconSrc = getIconImage('range.png') || getIconImage('range');
            if (rangeIconSrc) {
                rangeIcon.src = rangeIconSrc;
                rangeIcon.className = 'terrain-icon';
                rangeIcon.alt = 'Range';
                rangeContainer.appendChild(rangeIcon);
            }

            const rangeValue = document.createElement('span');
            rangeValue.textContent = card.range;
            rangeValue.className = 'range-value';
            rangeContainer.appendChild(rangeValue);

            typeContainer.appendChild(rangeContainer);
        }

        cardDiv.appendChild(typeContainer);
    }

    // Card text box
    const textBox = document.createElement('div');
    textBox.className = 'card-text-box';

    // Main card text
    if (card.cardText) {
        const mainText = document.createElement('div');
        mainText.className = 'card-main-text';
        // Use innerHTML to support HTML formatting like <i>, <b>, <strong>, <em>, etc.
        mainText.innerHTML = card.cardText;
        textBox.appendChild(mainText);
    }

    // Flavor text (italic and bottom-aligned)
    if (card.flavorText) {
        const flavorText = document.createElement('div');
        flavorText.className = 'card-flavor-text';
        flavorText.innerHTML = card.flavorText;
        textBox.appendChild(flavorText);
    }

    cardDiv.appendChild(textBox);

    // Card footer
    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const artist = document.createElement('div');
    artist.className = 'artist';
    artist.textContent = card.artist ? `Art: ${card.artist}` : '';
    footer.appendChild(artist);

    if (card.power && card.toughness) {
        const pt = document.createElement('div');
        pt.className = 'power-toughness';
        pt.textContent = `${card.power}/${card.toughness}`;
        footer.appendChild(pt);
    }

    cardDiv.appendChild(footer);

    return cardDiv;
}

// Show preview of cards
function showPreview() {
    cardPreview.innerHTML = '';

    cardData.forEach(card => {
        const cardElement = createCardElement(card);
        cardPreview.appendChild(cardElement);
    });

    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Generate PDF
async function generatePDF() {
    if (cardData.length === 0) {
        alert('Please upload a CSV file first');
        return;
    }

    // Show loading message
    generateBtn.textContent = 'Generating PDF...';
    generateBtn.disabled = true;

    try {
        // Clear print area and create pages
        printArea.innerHTML = '';
        const cardsPerPage = 9; // 3x3 grid
        const totalPages = Math.ceil(cardData.length / cardsPerPage);

        // Create all pages with cards
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
            const page = document.createElement('div');
            page.className = 'print-page';

            const startIdx = pageNum * cardsPerPage;
            const endIdx = Math.min(startIdx + cardsPerPage, cardData.length);

            for (let i = startIdx; i < endIdx; i++) {
                const cardElement = createCardElement(cardData[i]);
                page.appendChild(cardElement);
            }

            printArea.appendChild(page);
        }

        // Make print area visible for rendering
        printArea.style.display = 'block';

        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: 'letter'
        });

        // Render each page to PDF
        const pages = printArea.querySelectorAll('.print-page');

        for (let i = 0; i < pages.length; i++) {
            if (i > 0) {
                pdf.addPage();
            }

            const canvas = await html2canvas(pages[i], {
                scale: 2,
                useCORS: true,
                logging: false,
                width: 8.5 * 96, // 96 DPI
                height: 11 * 96
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11);
        }

        // Save PDF
        pdf.save('card-templates.pdf');

        // Hide print area again
        printArea.style.display = 'none';

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please check the console for details.');
    } finally {
        generateBtn.textContent = 'Generate PDF';
        generateBtn.disabled = false;
    }
}

// Test Card Designer
let testCardImageData = null;

const updateTestCardBtn = document.getElementById('update-test-card-btn');
const testCardDisplay = document.getElementById('test-card-display');
const testImageInput = document.getElementById('test-image');

// Handle test card image upload
testImageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            testCardImageData = event.target.result;
            updateTestCard();
        };
        reader.readAsDataURL(file);
    }
});

// Update test card preview
function updateTestCard() {
    const testCard = {
        name: document.getElementById('test-name').value || 'Unnamed Card',
        troopCost: document.getElementById('test-troopCost').value,
        manaCost: document.getElementById('test-manaCost').value,
        playableOn: document.getElementById('test-playableOn').value,
        type: document.getElementById('test-type').value,
        cardText: document.getElementById('test-cardText').value,
        flavorText: document.getElementById('test-flavorText').value,
        power: document.getElementById('test-power').value,
        toughness: document.getElementById('test-toughness').value,
        range: document.getElementById('test-range').value,
        artist: document.getElementById('test-artist').value,
        image: 'test-image' // Placeholder
    };

    // Temporarily add test image to imageMap
    if (testCardImageData) {
        imageMap['test-image'] = testCardImageData;
    }

    // Clear and render the test card
    testCardDisplay.innerHTML = '';
    const cardElement = createCardElement(testCard);
    testCardDisplay.appendChild(cardElement);
}

// Event listener for update button
updateTestCardBtn.addEventListener('click', updateTestCard);

// Download elfs folder as zip
const downloadElfsBtn = document.getElementById('download-elfs-btn');
if (downloadElfsBtn) {
    downloadElfsBtn.addEventListener('click', async function() {
        try {
            downloadElfsBtn.textContent = 'Downloading...';
            downloadElfsBtn.disabled = true;

            const zip = new JSZip();
            const elfsFolder = zip.folder('elfs');

            // List of files in the elfs folder
            const elfsFiles = [
                'elfs.csv',
                '00010-2446747513.png',
                '00049-1470756094.png',
                '00050-1789069772.png',
                '00051-2631949519.png',
                '00052-3663192815.png',
                '00057-301796533.png',
                '00062-2606519977.png',
                '00065-1790782103.png',
                '00077-2857751192.png',
                '00089-2681880704.png',
                '00097-2681880704.png',
                '00107-2681880705.png',
                '00117-2681880704.png',
                '00123-2681880704.png',
                '00130-2681880704.png',
                '00133-2681880704.png',
                '00135-2681880704.png',
                '00137-2681880704.png',
                '00138-2681880704.png',
                '00142-2681880704.png',
                '00143-2681880704.png',
                '00144-2681880704.png',
                '00145-2681880704.png'
            ];

            // Fetch and add each file to the zip
            for (const fileName of elfsFiles) {
                try {
                    const response = await fetch(`./elfs/${fileName}`);
                    if (response.ok) {
                        const blob = await response.blob();
                        elfsFolder.file(fileName, blob);
                        console.log(`Added ${fileName} to zip`);
                    }
                } catch (error) {
                    console.log(`Could not add ${fileName}:`, error);
                }
            }

            // Generate and download the zip
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'elfs-example.zip';
            a.click();
            URL.revokeObjectURL(url);

            downloadElfsBtn.textContent = 'Download Sample CSV + Photos';
            downloadElfsBtn.disabled = false;
        } catch (error) {
            console.error('Error creating zip:', error);
            alert('Error creating zip file. Please check the console for details.');
            downloadElfsBtn.textContent = 'Download Sample CSV + Photos';
            downloadElfsBtn.disabled = false;
        }
    });
}
