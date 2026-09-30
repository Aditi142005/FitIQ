/**
 * FitIQ — Centralized Backend URL Configuration
 *
 * Priority order:
 *  1. REACT_APP_BACKEND_URL env var (set this for production / ngrok / deployed backend)
 *  2. Defaults to http://127.0.0.1:5000 for local development
 *
 * For Android local testing:
 *   - Start the Flask server on your computer
 *   - Find your computer's local IP (e.g. 192.168.1.x)
 *   - Set REACT_APP_BACKEND_URL=http://192.168.1.x:5000 before building
 *     OR update the default below to your IP for quick testing
 *
 * DO NOT hardcode API keys here. All secrets live in backend/.env
 */
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

export default BACKEND_URL;
