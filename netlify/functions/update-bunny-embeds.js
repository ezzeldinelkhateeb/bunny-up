const { google } = require('googleapis');
require('dotenv').config();

exports.handler = async (event, context) => {
  // Set CORS headers for all responses
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
    const { videos } = JSON.parse(event.body);
    
    if (!Array.isArray(videos)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: 'Invalid videos data' 
        })
      };
    }

    // Parse credentials from environment variable
    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);
      console.log(`Using service account: ${credentials.client_email}`);
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
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'OPERATIONS';
    
    const notFoundVideos = [];
    let updatedCount = 0;

    for (const video of videos) {
      try {
        // Get the N column data
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!N:N`,
        });

        const rows = result.data.values || [];
        let rowIndex = -1;

        // Find matching row
        for (let i = 1; i < rows.length; i++) {
          const cellName = (rows[i]?.[0] || '').trim();
          if (cellName === video.name.split('.')[0].trim()) {
            rowIndex = i + 1;
            break;
          }
        }

        if (rowIndex === -1) {
          notFoundVideos.push(video.name);
          continue;
        }

        console.log(`Updating row ${rowIndex} for video: ${video.name}`);

        // Update the W column with embed code
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!W${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[video.embed_code]]
          }
        });

        updatedCount++;
      } catch (error) {
        console.error(`Error processing video ${video.name}:`, error.message);
        notFoundVideos.push(video.name);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `تم تحديث ${updatedCount} فيديو بنجاح`,
        details: notFoundVideos.length > 0 
          ? `لم يتم العثور على ${notFoundVideos.length} فيديو في الشيت`
          : undefined,
        not_found_videos: notFoundVideos
      })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: `خطأ في تحديث الشيت: ${error.message}`
      })
    };
  }
};
