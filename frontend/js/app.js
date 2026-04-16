// public/js/app.js
const STORAGE_KEY = "manuscript_data";
const VERSION_KEY = "manuscript_version";

async function loadData() {
    try {
        // Ask for the 40-byte version file
        const resVersion = await fetch('./data/version.json');
        const { version: liveVersion } = await resVersion.json();

        // Compare with local storage
        if (localStorage.getItem(VERSION_KEY) === liveVersion) {
            console.log("Loading fast from cache...");
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        }

        // If versions don't match, download the new data
        console.log("Downloading fresh manuscript...");
        const resData = await fetch('./data/manuscript.json');
        const data = await resData.json();

        // Save it for next time
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(VERSION_KEY, liveVersion);
        } catch (e) {
            console.warn("Could not cache data (Storage full).");
        }

        return data;
    } catch (error) {
        console.error("Failed to load manuscript:", error);
    }
}

function renderWebsite(data) {
    // 1. Update the static title
    document.getElementById('manuscript-title').innerText = data.title;

    // 2. Grab the empty container
    const container = document.getElementById('manuscript-container');
    let htmlContent = ""; // Start with an empty string

    // 3. Loop through the JSON array
    data.paragraphs.forEach(paragraph => {
        
        // We create HTML classes that match what we designed in Figma
        htmlContent += `
            <div class="paragraph-block" id="${paragraph.id}">
                <p class="manuscript-text">${paragraph.text}</p>
        `;

        // If this paragraph has an annotation in the JSON, add the UI for it
        if (paragraph.note) {
            htmlContent += `
                <aside class="margin-note">
                    <span class="note-icon">📝</span>
                    <span class="note-text">${paragraph.note}</span>
                </aside>
            `;
        }

        // Close the paragraph-block div
        htmlContent += `</div>`; 
    });

    // 4. Inject all the generated HTML into the page at once
    container.innerHTML = htmlContent;
}

// Update our previous initialization call to use this function:
loadData().then(data => {
    if (data) {
        renderWebsite(data);
    }
});
