const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Required to allow requests from your HTML file

const app = express();
const PORT = 3000;
const ordersFilePath = path.join(__dirname, 'orders.json'); // File to store orders

// Middleware to parse JSON bodies and allow CORS
app.use(bodyParser.json());
app.use(cors());

// A simple GET endpoint to confirm the server is running
app.get('/', (req, res) => {
    res.send('Server is running. Ready to accept orders!');
});

// The POST endpoint to handle order submissions
app.post('/submit-order', (req, res) => {
    const newOrder = req.body;
    
    // Add a timestamp to the order for tracking
    newOrder.timestamp = new Date().toISOString();

    // Read the existing orders from the file
    fs.readFile(ordersFilePath, (err, data) => {
        let orders = [];
        if (!err) {
            try {
                // If the file exists and is not empty, parse the JSON
                orders = JSON.parse(data);
            } catch (parseError) {
                // If there's a parsing error, log it and start with an empty array
                console.error('Error parsing orders.json:', parseError);
            }
        }

        // Add the new order to the array
        orders.push(newOrder);

        // Write the updated array back to the file
        fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Failed to write order to file:', writeErr);
                return res.status(500).json({ message: 'Failed to place order.' });
            }

            console.log('New order saved successfully!');
            res.status(200).json({ message: 'Order placed successfully!' });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});