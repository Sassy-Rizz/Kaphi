// server.js - This file will contain your server-side logic

const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors'); // Required to allow requests from your GitHub Pages site

const app = express();
const port = 3000; // You can change this port if needed

// --- IMPORTANT: Google Sheets API Setup ---
// These credentials should NOT be hardcoded in production.
// Use environment variables or a secure configuration method.
// You need to set up a Service Account in Google Cloud Platform
// and download its JSON key file.
// Replace 'path/to/your/service-account-key.json' with the actual path.
const KEYFILEPATH = './path/to/your/service-account-key.json'; 
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1EVvl100GVBrtXmW6Dm-cCYgxWYbqayabzhQlgrxs6Yw'; // Your Google Sheet ID

// Authenticate with Google
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

// Middleware
app.use(bodyParser.json()); // To parse JSON bodies from incoming requests
app.use(cors()); // Allow requests from any origin (your GitHub Pages site)

// Serve your static HTML, CSS, JS files (if running locally)
// If your HTML is on GitHub Pages, you might not need this line on the server.
// app.use(express.static('public')); 

// Endpoint to receive coffee orders
app.post('/submit-order', async (req, res) => {
  try {
    const order = req.body;
    const timestamp = new Date().toLocaleString(); // Get current date and time

    // Prepare rows to append to Google Sheet
    // Each item in the order gets its own row for detailed logging
    const rows = [];
    let totalOrderPrice = 0; // Calculate total for the entire order

    order.items.forEach(item => {
      const itemTotal = (item.qty * item.price) + (item.temp === 'cold' ? item.qty * 10 : 0);
      totalOrderPrice += itemTotal;
      rows.push([
        order.name,
        order.batch,
        order.room,
        item.name,
        item.qty,
        item.temp,
        itemTotal,
        timestamp // Add timestamp to each item row
      ]);
    });

    // Add a final summary row for the entire order
    // Ensure this matches the headers in your Google Sheet (Name, Batch, Room, Coffee, Quantity, Temperature, Total Price, Timestamp)
    rows.push([
      order.name, // Name of the person who placed the order
      order.batch, // Batch of the person
      order.room, // Room number
      'Final Order Total',
      '', // Quantity (empty for total row)
      '', // Temperature (empty for total row)
      totalOrderPrice,
      timestamp // Timestamp for the total row
    ]);
    
    // Append data to the specified Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEED_ID,
      range: 'Sheet1!A:H', // Adjust this range based on your sheet's column structure (A to H for 8 columns)
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rows,
      },
    });

    console.log('Order successfully written to Google Sheet:', order);
    res.status(200).json({ message: 'Order received and saved successfully!' });

  } catch (error) {
    console.error('Error submitting order to Google Sheet:', error);
    res.status(500).json({ error: 'Failed to submit order.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Waiting for incoming coffee orders...');
});
