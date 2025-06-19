# Frontend Environment Setup

## Environment Variables for Netlify Deployment

### Required Environment Variables

Set these in your Netlify dashboard under **Site settings > Environment variables**:

```
VITE_API_BASE_URL=https://famous-dragon-b033ac.netlify.app/.netlify/functions/api
```

### Local Development

Create a `.env.local` file in the `friskefrugter/` directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Environment Variable Explanation

- **VITE_API_BASE_URL**: The base URL for your backend API
  - Local: `http://localhost:3001/api`
  - Production: `https://famous-dragon-b033ac.netlify.app/.netlify/functions/api`

### Netlify Deployment Steps

1. **Set Environment Variables:**
   - Go to your Netlify dashboard
   - Navigate to Site settings > Environment variables
   - Add `VITE_API_BASE_URL` with the production backend URL

2. **Redeploy:**
   - Trigger a new deployment or push to main branch
   - The environment variables will be available at build time

### Troubleshooting

If you're still getting NetworkError:

1. **Check CORS Configuration:**
   - Ensure your backend has `https://b2bengross.netlify.app` in the CORS allowed origins
   - Check the backend environment variable `CORS_ORIGIN`

2. **Verify API URL:**
   - Test the backend URL directly: `https://famous-dragon-b033ac.netlify.app/.netlify/functions/api/health`
   - Should return a JSON response

3. **Check Browser Console:**
   - Look for CORS errors in the browser developer tools
   - Check if the request is being made to the correct URL

4. **Environment Variable Debug:**
   - Add this to your component to debug:
   ```typescript
   console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
   ``` 