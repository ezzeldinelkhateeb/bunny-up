import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Updated CORS configuration to accept all origins in development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['your-production-domain.com'] 
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Sheets update endpoint
app.post('/api/sheets/update-bunny-embeds', async (req, res) => {
  try {
    const { videos } = req.body;
    
    if (!Array.isArray(videos)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid videos data' 
      });
    }

    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);
    } catch (error) {
      console.error('Error parsing credentials:', error);
      return res.status(500).json({
        success: false,
        message: 'Invalid Google Sheets credentials configuration'
      });
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
        console.error(`Error processing video ${video.name}:`, error);
        notFoundVideos.push(video.name);
      }
    }

    return res.json({
      success: true,
      message: `تم تحديث ${updatedCount} فيديو بنجاح`,
      details: notFoundVideos.length > 0 
        ? `لم يتم العثور على ${notFoundVideos.length} فيديو في الشيت`
        : undefined,
      not_found_videos: notFoundVideos
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      message: `خطأ في تحديث الشيت: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add new endpoint for bandwidth stats
app.post('/api/sheets/update-bandwidth-stats', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid data format'
      });
    }

    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);
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

    res.json({
      success: true,
      message: `Updated ${data.length} days of bandwidth statistics`
    });

  } catch (error) {
    console.error('Error updating bandwidth stats:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Add a proper handler for the test-sheets-connection endpoint
app.get('/api/test-sheets-connection', async (req, res) => {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON || '{}');
    
    if (!credentials || !Object.keys(credentials).length) {
      return res.status(400).json({
        success: false,
        message: 'Google Sheets credentials not configured'
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: `${process.env.GOOGLE_SHEET_NAME || 'OPERATIONS'}!A1:A1`
    });

    res.json({
      success: true,
      message: 'Successfully connected to Google Sheets',
      data: {
        sheetName: process.env.GOOGLE_SHEET_NAME || 'OPERATIONS',
        hasValues: !!response.data.values?.length
      }
    });

  } catch (error) {
    console.error('Google Sheets Test Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Google Sheets',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Global error handler
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
