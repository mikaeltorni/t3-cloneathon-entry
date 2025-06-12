# 🔥 Firebase Setup Guide

This guide helps you set up Firebase properly for the OpenRouter Chat App, handling the complexities of `firebase init` and ensuring security rules are correctly applied.

## 🚨 Important: Firebase Init Cleanup Required

When you run `firebase init`, it creates many unnecessary files and can overwrite our carefully crafted security rules. This guide ensures you get a clean, secure setup.

## 📋 Quick Setup (Recommended)

After cloning the repository and running `firebase init`, use our automated cleanup script:

### Option A: Cross-Platform (Node.js)
```bash
npm run setup:firebase
```

### Option B: Windows PowerShell
```bash
npm run setup:firebase:windows
```

### Option C: Manual Script Execution
```bash
# Cross-platform
node scripts/setup-firebase.js

# Windows
powershell -ExecutionPolicy Bypass -File scripts/setup-firebase.ps1
```

## 🔧 Manual Setup (Step by Step)

If you prefer to do it manually or the scripts don't work:

### 1. Prerequisites
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### 2. Initialize Firebase (if not done)
```bash
firebase init
```

**Important**: When prompted, only select **Firestore** (not Functions, Hosting, etc.)

### 3. Clean Up Unnecessary Files

Remove these directories (if they exist):
```bash
# Remove unnecessary directories
rm -rf functions/
rm -rf public/
rm -rf extensions/
rm -rf dataconnect/
rm -rf dataconnect-generated/

# Remove unnecessary files
rm database.rules.json
rm remoteconfig.template.json
rm storage.rules
```

### 4. Restore Configuration Files

Replace `firebase.json` with minimal configuration:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

Ensure `firestore.rules` contains our security rules:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can only access their own chat collections
      match /chats/{chatId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Users can only access messages within their own chats
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    
    // Deny access to all other documents
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 5. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

## 🔍 What the Setup Scripts Do

Our automated scripts perform these actions:

1. **Verify Firebase CLI** - Ensures Firebase CLI is installed and accessible
2. **Clean Up Files** - Removes unnecessary directories and files created by `firebase init`
3. **Restore Configuration** - Copies our secure configuration from templates
4. **Deploy Rules** - Automatically deploys the Firestore security rules
5. **Verify Setup** - Confirms everything is configured correctly

## 📁 File Structure After Setup

After proper setup, your Firebase files should look like this:

```
├── .firebaserc              # Firebase project configuration
├── firebase.json             # Minimal Firestore configuration
├── firestore.rules          # Security rules (CRITICAL)
├── firestore.indexes.json   # Database indexes
├── firestore.rules.template # Backup template (for restoration)
├── firebase.json.template   # Backup template (for restoration)
└── scripts/
    ├── setup-firebase.js    # Cross-platform setup script
    └── setup-firebase.ps1   # Windows PowerShell script
```

## 🚫 What Gets Removed

These files/directories are removed because they're not needed for our app:

- `functions/` - We don't use Cloud Functions
- `public/` - We don't use Firebase Hosting  
- `extensions/` - We don't use Firebase Extensions
- `dataconnect/` - We don't use Firebase Data Connect
- `dataconnect-generated/` - Generated code we don't need
- `database.rules.json` - We use Firestore, not Realtime Database
- `remoteconfig.template.json` - We don't use Remote Config
- `storage.rules` - We don't use Cloud Storage

## 🔐 Security Verification

After setup, verify your security rules are active:

1. **Check Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to "Firestore Database" → "Rules"
   - Confirm the rules match our secure configuration

2. **Test Access Control**:
   - Rules should restrict access to `/users/{userId}` where `userId` must match `request.auth.uid`
   - All other paths should be denied

## 🐛 Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase login
```

### "Permission denied during deployment"
```bash
firebase login
firebase use --add  # If multiple projects
```

### "Rules compilation failed"
Check `firestore.rules` syntax - ensure proper JavaScript formatting

### "Template files not found"
Run the setup script from the project root directory:
```bash
cd /path/to/openrouter-chat-app
npm run setup:firebase
```

### "Rules not taking effect"
Wait 1-2 minutes after deployment, then verify in Firebase Console

## 💡 Tips for Contributors

1. **Always run setup after `firebase init`** - Never commit the extra files
2. **Test security rules** - Verify user isolation is working
3. **Update templates** - If you modify rules, update the `.template` files
4. **Check .gitignore** - Ensure unnecessary Firebase files are ignored

## 🎯 Production Deployment

For production deployment:

1. Run the setup process as described above
2. Verify security rules are deployed: `firebase deploy --only firestore:rules`
3. Test authentication and data access
4. Monitor Firebase Console for any security issues

---

**🔐 Remember: Security rules are the last line of defense. Always verify they're correctly deployed before using the app with real data.** 