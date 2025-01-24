const express = require('express'); // Import Express
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin'); // Import Firebase Admin SDK
require('dotenv').config();


const app = express(); // Initialize Express
const PORT = process.env.PORT || 3000; // Use environment port or 3000

// Firebase Admin Initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://live-intentionally-default-rtdb.europe-west1.firebasedatabase.app/', // Replace with your Firebase Database URL
});

const db = admin.database();

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for now
app.use(bodyParser.json({ limit: '10mb' })); // Support larger JSON payloads
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public'

// app.get('/test-firebase', async (req, res) => {
//     const ref = db.ref('progress');
//     ref.set({ test: true }, (error) => {
//         if (error) {
//             console.error('Error writing test data to Firebase:', error);
//             res.status(500).json({ error: 'Failed to connect to Firebase' });
//         } else {
//             console.log('Test data written to Firebase.');
//             res.json({ success: true });
//         }
//     });
// });


// Endpoint to load progress from Firebase
app.get('/progress', async (req, res) => {
    const ref = db.ref('progress');
    ref.once('value', (snapshot) => {
        console.log(snapshot.val());
        res.json(snapshot.val() || {});
    }, (error) => {
        console.error('Error reading from Firebase:', error);
        res.status(500).json({ error: 'Failed to load progress' });
    });
});

// Endpoint to save progress to Firebase
app.post('/progress', async (req, res) => {
    const progress = req.body;

    // Validate incoming data
    if (!progress || typeof progress !== 'object') {
        console.error('Invalid data format received:', progress);
        return res.status(400).json({ error: 'Invalid data format' });
    }

    const ref = db.ref('progress');
    ref.update(progress, (error) => {
        if (error) {
            console.error('Error saving progress to Firebase:', error);
            res.status(500).json({ error: 'Failed to save progress' });
        } else {
            console.log('Progress saved to Firebase:', progress); // Log data being saved
            res.json({ success: true });
        }
    });
});

// Fallback route to serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
