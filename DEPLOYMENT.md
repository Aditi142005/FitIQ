# FitIQ Flask Backend Deployment

The repository is prepared for a Render Blueprint deployment. The blueprint uses the repository
root as its source so the Flask app can load the existing model and ML datasets from `ml/`.
`render.yaml` selects Render's Standard web-service plan because the behavior analytics endpoint
loads a large foundation dataset into memory. The plan is paid.

## Deploy on Render

1. Sign in to [Render](https://dashboard.render.com/).
2. Choose **New +** > **Blueprint**.
3. Connect the `Aditi142005/FitIQ` GitHub repository and select the branch containing these changes.
4. Review the `fitiq-api` service in `render.yaml`, authorize the paid Standard plan, and deploy.
5. In the service's **Environment** settings, add whichever server-only LLM secrets are configured:
   - `GEMINI_API_KEY` (primary)
   - `LLM_API_KEY` (alternate Gemini key name)
   - `OPENAI_API_KEY` (fallback)
6. Keep `FITIQ_CORS_ORIGINS` set to `https://localhost` for the Capacitor Android app. Add the exact
   HTTPS origin as a comma-separated entry if a separately hosted web frontend also calls Flask.
7. Wait for the Render service to report **Live**. Copy its assigned HTTPS hostname and verify:

   ```powershell
   Invoke-RestMethod "https://<render-service-host>/health"
   ```

The health response should be `status: ok`. No permanent service URL exists until Render has
created the service under an authorized account. Do not put API keys or Firebase service-account
credentials into this repository or the APK.

## Runtime configuration

- Render supplies `PORT`; Gunicorn binds to `0.0.0.0:$PORT`.
- `FITIQ_CORS_ORIGINS` is a comma-separated allowlist; the blueprint defaults to `https://localhost`.
- LLM API keys are optional. The existing interpretation endpoint uses its deterministic analytics
  interpretation if no LLM key is configured.
- The backend does not use Firebase Admin or a service account. Existing Firebase Authentication
  and Firestore calls run in the React client using the existing Firebase web configuration and
  Firestore security rules. Keep those rules restrictive; the Firebase web API key is a public
  client identifier, not a server credential.
- Model and dataset paths are relative to the checked-out source tree. The required model, meal
  dataset, nutrition data, and analytics foundation CSV are tracked in Git.

## Build the Android APK after deployment

Set the real Render HTTPS origin before building; React embeds the value into the APK at build time:

```powershell
Set-Location "C:\path\to\FitIQ\frontend"
$env:REACT_APP_BACKEND_URL = "https://<render-service-host>"
npm run android:build
```

Do not build or distribute the final APK with a local IP, localhost, or a placeholder hostname.
