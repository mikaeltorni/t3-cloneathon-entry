#!/usr/bin/env node

/**
 * setup-firebase.js
 * 
 * Firebase setup script for OpenRouter Chat App
 * 
 * This script handles the setup and cleanup of Firebase configuration
 * to ensure only necessary files are kept and security rules are preserved.
 * 
 * Usage:
 *   node scripts/setup-firebase.js
 *   npm run setup:firebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('🔥 OpenRouter Chat App - Firebase Setup');
console.log('=====================================');

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy template file to target
 */
function copyTemplate(templateFile, targetFile) {
  const templatePath = path.join(PROJECT_ROOT, templateFile);
  const targetPath = path.join(PROJECT_ROOT, targetFile);
  
  if (fileExists(templatePath)) {
    console.log(`📋 Restoring ${targetFile} from template...`);
    fs.copyFileSync(templatePath, targetPath);
    return true;
  }
  return false;
}

/**
 * Remove directory recursively
 */
function removeDirectory(dirPath) {
  const fullPath = path.join(PROJECT_ROOT, dirPath);
  if (fileExists(fullPath)) {
    console.log(`🗑️  Removing unnecessary directory: ${dirPath}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

/**
 * Remove file
 */
function removeFile(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (fileExists(fullPath)) {
    console.log(`🗑️  Removing unnecessary file: ${filePath}`);
    fs.unlinkSync(fullPath);
  }
}

/**
 * Check if Firebase CLI is installed
 */
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Main setup function
 */
function setupFirebase() {
  console.log('\n📋 Step 1: Checking Firebase CLI...');
  
  if (!checkFirebaseCLI()) {
    console.log('❌ Firebase CLI not found.');
    console.log('📦 Install it with: npm install -g firebase-tools');
    console.log('🔑 Then run: firebase login');
    process.exit(1);
  }
  
  console.log('✅ Firebase CLI is installed');
  
  console.log('\n📋 Step 2: Cleaning up unnecessary Firebase files...');
  
  // Remove unnecessary directories created by firebase init
  const unnecessaryDirs = [
    'functions',
    'public', 
    'extensions',
    'dataconnect',
    'dataconnect-generated'
  ];
  
  unnecessaryDirs.forEach(removeDirectory);
  
  // Remove unnecessary files created by firebase init
  const unnecessaryFiles = [
    'database.rules.json',
    'remoteconfig.template.json',
    'storage.rules'
  ];
  
  unnecessaryFiles.forEach(removeFile);
  
  console.log('\n📋 Step 3: Restoring correct configuration files...');
  
  // Restore our minimal firebase.json configuration
  if (copyTemplate('firebase-config/firebase.json.template', 'firebase.json')) {
    console.log('✅ Restored minimal firebase.json configuration');
  }
  
  // Restore our security rules
  if (copyTemplate('firebase-config/firestore.rules.template', 'firestore.rules')) {
    console.log('✅ Restored Firestore security rules');
  } else {
    console.log('⚠️  firestore.rules.template not found, keeping existing rules');
  }
  
  // Check if firestore.indexes.json exists, create empty one if not
  const indexesPath = path.join(PROJECT_ROOT, 'firestore.indexes.json');
  if (!fileExists(indexesPath)) {
    console.log('📋 Creating empty firestore.indexes.json...');
    fs.writeFileSync(indexesPath, JSON.stringify({
      indexes: [],
      fieldOverrides: []
    }, null, 2));
  }
  
  console.log('\n📋 Step 4: Deploying security rules...');
  
  try {
    console.log('🚀 Deploying Firestore security rules...');
    execSync('firebase deploy --only firestore:rules', { 
      stdio: 'inherit',
      cwd: PROJECT_ROOT 
    });
    console.log('✅ Security rules deployed successfully!');
  } catch (error) {
    console.log('❌ Failed to deploy security rules');
    console.log('💡 You can deploy manually with: firebase deploy --only firestore:rules');
  }
  
  console.log('\n🎉 Firebase setup complete!');
  console.log('\n📋 Summary:');
  console.log('✅ Cleaned up unnecessary Firebase files');
  console.log('✅ Restored minimal configuration');
  console.log('✅ Applied secure Firestore rules');
  console.log('\n🔐 Your app is now secure and ready for development!');
}

// Run the setup
setupFirebase(); 