# React + TypeScript + Vite
npm run dev
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

# Bunny Uploader
A tool for uploading and managing videos on Bunny.net CDN with Google Sheets integration.

## Getting Started

To run this application locally:

```bash
# Install dependencies
npm install

# Start the development server and backend API simultaneously
npm run dev
```

The application will be available at http://localhost:5173

## Deployment on Netlify

This application is configured for deployment on Netlify using Netlify Functions for the API endpoints.

### Deploying to Netlify

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Create a new site on Netlify and connect it to your repository
3. Configure the build settings:
   - Build command: `npm run build:netlify`
   - Publish directory: `dist`

### Environment Variables in Netlify

In your Netlify site dashboard, go to **Site settings** > **Build & Deploy** > **Environment variables** and add:

- `GOOGLE_SHEETS_CREDENTIALS_JSON`: The full JSON string of your Google service account credentials
- `GOOGLE_SHEETS_SPREADSHEET_ID`: Your Google Sheets spreadsheet ID
- `GOOGLE_SHEET_NAME`: The name of your sheet (default is "OPERATIONS")

### Troubleshooting Netlify Deployment

If you encounter issues with the Netlify Functions:

1. Check the Netlify Functions logs in your Netlify dashboard
2. Ensure all environment variables are correctly set
3. Verify that the Google service account has permission to access your spreadsheet

## API Server Setup (Local Development)

The application requires a backend server running for Google Sheets integration and other API functions. The server runs on port 3001 by default.

### Cross-Origin Resource Sharing (CORS)

The server is configured to handle CORS requests in development mode. If you're experiencing CORS issues:

1. Make sure you're running both the frontend and backend services:
   ```bash
   npm run dev
```

### Google Sheets Permissions

This application requires a Google Service Account with write permissions to the spreadsheet:

1. Make sure the service account email has been granted Editor access to the Google Sheet
2. To grant access, open your Google Sheet, click "Share" and add the service account email with Editor permissions
3. If you're experiencing permission errors when updating sheets, check:
   - That the correct service account is being used (check the .env file)
   - That the service account has been explicitly granted access to the spreadsheet
   - The spreadsheet ID in your .env file matches the actual spreadsheet you want to access
