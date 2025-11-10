// Global state
let cardData = [];
let imageMap = {};
let iconMap = {};

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
        'chaos.png'
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

// Event listeners
csvUpload.addEventListener('change', handleCSVUpload);
imageUpload.addEventListener('change', handleImageUpload);
generateBtn.addEventListener('click', generatePDF);
previewBtn.addEventListener('click', showPreview);

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
