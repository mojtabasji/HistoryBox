# Google Maps Setup Guide

## Step 1: Get Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click "Select a project" at the top
   - Either create a new project or select an existing one

3. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - **Maps JavaScript API** (required for map display)
     - **Places API** (required for location search)
     - **Geocoding API** (optional, for address conversion)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. **Secure Your API Key (Recommended)**
   - Click on your API key to edit it
   - Under "Application restrictions", choose "HTTP referrers"
   - Add your domains:
     - `localhost:3000/*` (for development)
     - `your-domain.com/*` (for production)
   - Under "API restrictions", select "Restrict key"
   - Choose the APIs you enabled above

## Step 2: Configure Your Application

1. **Create Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Add Your API Key**
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Step 3: Test the Integration

1. Navigate to `http://localhost:3000/map`
2. You should see an interactive map with sample markers
3. Click on markers to see info windows with details

## Troubleshooting

### Common Issues:

1. **"This page can't load Google Maps correctly"**
   - Check if your API key is correct
   - Ensure Maps JavaScript API is enabled
   - Check browser console for specific error messages

2. **Map shows but markers don't appear**
   - Verify your post data has valid latitude/longitude
   - Check browser console for JavaScript errors

3. **"For development purposes only" watermark**
   - This appears when you haven't set up billing in Google Cloud
   - For production, you'll need to enable billing

4. **API Key restrictions**
   - Make sure localhost:3000 is in your HTTP referrers
   - Check that required APIs are included in restrictions

### Cost Information:

- Google Maps offers $200 free credit monthly
- Maps JavaScript API: $7 per 1,000 loads
- Places API: $17 per 1,000 requests
- For most small applications, the free tier is sufficient

## Features Implemented:

- ✅ **Interactive Google Map** with zoom and pan
- ✅ **Custom Markers** for each location
- ✅ **Info Windows** with post details and images
- ✅ **Responsive Design** that works on mobile
- ✅ **Loading States** with proper error handling
- ✅ **Sample Data** for demonstration
- ✅ **Click Handlers** for marker interaction

## Next Steps:

1. Replace sample data with real user posts from your database
2. Add functionality to create new posts with location picker
3. Implement clustering for better performance with many markers
4. Add search functionality to find specific locations
5. Consider adding custom map styles for better branding
