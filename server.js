const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3000; // Use the port provided by Render or default to 3000
const filePath = './progress.json';

// Promisify fs.readFile and fs.writeFile for better async handling
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for now (can restrict for production)
app.use(bodyParser.json({ limit: '10mb' })); // Increase payload size limit
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder

// Ensure `progress.json` exists and is valid
async function initializeProgressFile() {
    if (!fs.existsSync(filePath)) {
        console.log('progress.json not found. Creating a new one.');
        await writeFile(filePath, '{}', 'utf8'); // Create an empty JSON file
    } else {
        try {
            const data = await readFile(filePath, 'utf8');
            JSON.parse(data); // Validate existing JSON
        } catch (err) {
            console.error('Invalid JSON detected in progress.json. Resetting file.');
            await writeFile(filePath, '{}', 'utf8'); // Reset to an empty JSON object
        }
    }
}

// Initialize `progress.json` on server startup
initializeProgressFile().catch((err) => console.error('Error initializing progress.json:', err));

// Endpoint to load progress
app.get('/progress', async (req, res) => {
    try {
        const data = await readFile(filePath, 'utf8');
        const progress = JSON.parse(data || '{}'); // Safely parse or default to empty object
        res.json(progress);
    } catch (err) {
        console.error('Error reading progress.json:', err);
        res.status(500).json({ error: 'Failed to load progress' });
    }
});

// Endpoint to save progress
app.post('/progress', async (req, res) => {
    const progress = req.body;

    // Validate incoming data
    if (!progress || typeof progress !== 'object') {
        console.error('Invalid data format received:', progress);
        return res.status(400).json({ error: 'Invalid data format' });
    }

    try {
        const currentData = await readFile(filePath, 'utf8');
        const existingProgress = JSON.parse(currentData || '{}');

        // Merge new progress with existing data
        const updatedProgress = { ...existingProgress, ...progress };

        // Write the updated progress to the file
        await writeFile(filePath, JSON.stringify(updatedProgress, null, 2), 'utf8');
        res.json({ success: true });
    } catch (err) {
        console.error('Error writing to progress.json:', err);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// Fallback route to serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
