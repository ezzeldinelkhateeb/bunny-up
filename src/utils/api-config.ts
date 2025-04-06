/**
 * Gets the base URL for API requests based on the current environment
 */
export function getApiBaseUrl(): string {
  // In production (Netlify), use the Netlify Functions path
  if (import.meta.env.PROD) {
    return '/.netlify/functions';
  }
  // In development, use the local server
  return 'http://localhost:3001/api';
}

/**
 * Gets the full URL for a specific API endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${getApiBaseUrl()}/${endpoint}`;
}
