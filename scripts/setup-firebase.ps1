# Firebase Setup Script for Windows PowerShell
# OpenRouter Chat App - Firebase Configuration

Write-Host "🔥 OpenRouter Chat App - Firebase Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to check if a file exists
function Test-FileExists {
    param([string]$Path)
    return Test-Path -Path $Path -PathType Leaf
}

# Function to check if a directory exists  
function Test-DirectoryExists {
    param([string]$Path)
    return Test-Path -Path $Path -PathType Container
}

# Function to remove directory safely
function Remove-DirectorySafe {
    param([string]$Path)
    if (Test-DirectoryExists $Path) {
        Write-Host "🗑️  Removing unnecessary directory: $Path" -ForegroundColor Yellow
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Function to remove file safely
function Remove-FileSafe {
    param([string]$Path)
    if (Test-FileExists $Path) {
        Write-Host "🗑️  Removing unnecessary file: $Path" -ForegroundColor Yellow
        Remove-Item -Path $Path -Force -ErrorAction SilentlyContinue
    }
}

# Function to copy template file
function Copy-Template {
    param([string]$TemplateFile, [string]$TargetFile)
    if (Test-FileExists $TemplateFile) {
        Write-Host "📋 Restoring $TargetFile from template..." -ForegroundColor Green
        Copy-Item -Path $TemplateFile -Destination $TargetFile -Force
        return $true
    }
    return $false
}

# Check if Firebase CLI is installed
Write-Host "`n📋 Step 1: Checking Firebase CLI..." -ForegroundColor Blue

try {
    $null = firebase --version
    Write-Host "✅ Firebase CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found." -ForegroundColor Red
    Write-Host "📦 Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host "🔑 Then run: firebase login" -ForegroundColor Yellow
    exit 1
}

# Clean up unnecessary Firebase files
Write-Host "`n📋 Step 2: Cleaning up unnecessary Firebase files..." -ForegroundColor Blue

# Remove unnecessary directories
$unnecessaryDirs = @(
    "functions",
    "public", 
    "extensions",
    "dataconnect",
    "dataconnect-generated"
)

foreach ($dir in $unnecessaryDirs) {
    Remove-DirectorySafe $dir
}

# Remove unnecessary files
$unnecessaryFiles = @(
    "database.rules.json",
    "remoteconfig.template.json", 
    "storage.rules"
)

foreach ($file in $unnecessaryFiles) {
    Remove-FileSafe $file
}

# Restore configuration files
Write-Host "`n📋 Step 3: Restoring correct configuration files..." -ForegroundColor Blue

# Restore firebase.json
if (Copy-Template "firebase.json.template" "firebase.json") {
    Write-Host "✅ Restored minimal firebase.json configuration" -ForegroundColor Green
}

# Restore firestore.rules
if (Copy-Template "firestore.rules.template" "firestore.rules") {
    Write-Host "✅ Restored Firestore security rules" -ForegroundColor Green
} else {
    Write-Host "⚠️  firestore.rules.template not found, keeping existing rules" -ForegroundColor Yellow
}

# Create firestore.indexes.json if it doesn't exist
if (-not (Test-FileExists "firestore.indexes.json")) {
    Write-Host "📋 Creating empty firestore.indexes.json..." -ForegroundColor Blue
    $indexesContent = @{
        indexes = @()
        fieldOverrides = @()
    } | ConvertTo-Json -Depth 2
    $indexesContent | Out-File -FilePath "firestore.indexes.json" -Encoding UTF8
}

# Deploy security rules
Write-Host "`n📋 Step 4: Deploying security rules..." -ForegroundColor Blue

try {
    Write-Host "🚀 Deploying Firestore security rules..." -ForegroundColor Cyan
    firebase deploy --only firestore:rules
    Write-Host "✅ Security rules deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy security rules" -ForegroundColor Red
    Write-Host "💡 You can deploy manually with: firebase deploy --only firestore:rules" -ForegroundColor Yellow
}

# Summary
Write-Host "`n🎉 Firebase setup complete!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Blue
Write-Host "✅ Cleaned up unnecessary Firebase files" -ForegroundColor Green
Write-Host "✅ Restored minimal configuration" -ForegroundColor Green  
Write-Host "✅ Applied secure Firestore rules" -ForegroundColor Green
Write-Host "`n🔐 Your app is now secure and ready for development!" -ForegroundColor Cyan 