const fs = require('fs');
const path = require('path');

console.log('Building AI Snake 95 for Android...');

// Create www directory if it doesn't exist
const wwwDir = './www';
if (!fs.existsSync(wwwDir)) {
    fs.mkdirSync(wwwDir);
    console.log('Created www directory');
}

// Files to copy
const filesToCopy = [
    'index.html',
    'game.js',
    'ai-engine.js',
    'styles.css',
    'manifest.json'
];

// Copy files to www directory
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(wwwDir, file));
        console.log(`Copied ${file} to www/`);
    } else {
        console.warn(`Warning: ${file} not found`);
    }
});

console.log('Build complete! Files copied to www/ directory');
console.log('Now run: npx cap copy android');