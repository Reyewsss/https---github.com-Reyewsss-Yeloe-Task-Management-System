# Google Calendar API Integration Setup

## Prerequisites
1. Google Account
2. Google Cloud Console access

## Step-by-Step Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Yeloe Task System"
4. Click "Create"

### 2. Enable Google Calendar API
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in required fields (App name, support email)
   - Add test users if needed
   - Save and continue
4. Back to creating OAuth client ID:
   - Application type: "Web application"
   - Name: "Yeloe Calendar Integration"
   - Authorized JavaScript origins: Add your domain (e.g., `https://localhost:5159` or your production URL)
   - Authorized redirect URIs: Add your domain + callback path
5. Click "Create"
6. Copy the **Client ID** and **API Key**

### 4. Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API Key
4. (Optional but recommended) Click "Restrict Key":
   - API restrictions: Select "Google Calendar API"
   - Save

### 5. Update Your Application

Open `Views/Planner/Index.cshtml` and update the configuration:

```javascript
window.googleCalendarConfig = {
    apiKey: 'YOUR_ACTUAL_API_KEY_HERE', // Replace with your API key from step 4
    clientId: 'YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com', // Replace with your Client ID from step 3
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    scope: 'https://www.googleapis.com/auth/calendar.readonly'
};
```

### 6. Test the Integration
1. Run your application
2. Navigate to the Planner page
3. Click "Sync Google Calendar" button
4. Sign in with your Google account
5. Grant permissions
6. Your Google Calendar events should now appear!

## Features

### Current Features
- ✅ View all tasks and projects in calendar format
- ✅ Sync with Google Calendar (read-only)
- ✅ Multiple calendar views (Month, Week, Day, Agenda)
- ✅ Event details modal
- ✅ Color-coded priorities
- ✅ Drag and drop support
- ✅ Responsive design

### Upcoming Features
- 📝 Two-way sync (write to Google Calendar)
- 🔔 Event reminders
- 🔄 Automatic sync every X minutes
- 📱 Mobile app integration
- 👥 Team calendar sharing

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit API keys to version control**
   - Add `appsettings.json` to `.gitignore`
   - Use environment variables in production

2. **Restrict API Key usage**
   - Set HTTP referrer restrictions
   - Limit to specific APIs

3. **Use OAuth 2.0 properly**
   - Only request necessary scopes
   - Implement proper token refresh

## Troubleshooting

### Common Issues

**Issue:** "API key not valid"
- **Solution:** Make sure you've enabled the Google Calendar API and the key is correctly copied

**Issue:** "redirect_uri_mismatch"
- **Solution:** Add your domain to Authorized redirect URIs in Google Cloud Console

**Issue:** "Access denied"
- **Solution:** Make sure you've added your Google account as a test user in the OAuth consent screen

**Issue:** Events not loading
- **Solution:** Check browser console for errors, verify API key and Client ID are correct

## Support

For more information:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)

## License
This integration is part of the Yeloe Task System.
