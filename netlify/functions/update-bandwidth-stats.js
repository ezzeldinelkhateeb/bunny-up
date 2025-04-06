const { google } = require('googleapis');
require('dotenv').config();

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        message: 'Method not allowed' 
      })
    };
  }

  try {
    const { data } = JSON.parse(event.body);
    
    if (!Array.isArray(data)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: 'Invalid data format'
        })
      };
    }

    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);
    } catch (error) {
      console.error('Error parsing credentials:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid Google Sheets credentials configuration'
        })
      };
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // First, ensure the sheet exists or create it
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'BandwidthStats'
              }
            }
          }]
        }
      });
    } catch (error) {
      // Sheet might already exist, ignore the error
      console.log('Sheet might already exist:', error.message);
    }

    // Update the sheet with data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'BandwidthStats!A1', // Use sheet name without spaces
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['Date', 'Bandwidth (GB)', 'Cost ($)'],
          ...data.map(row => [
            row.Date,
            Number(row['Bandwidth (GB)']).toFixed(2),
            Number(row['Cost ($)']).toFixed(2)
          ])
        ]
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Updated ${data.length} days of bandwidth statistics`
      })
    };

  } catch (error) {
    console.error('Error updating bandwidth stats:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      })
    };
  }
};
