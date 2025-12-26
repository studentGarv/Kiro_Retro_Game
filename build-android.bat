@echo off
echo Building AI Snake 95 for Android...

REM Create www directory if it doesn't exist
if not exist "www" mkdir www

REM Copy all web files to www directory
echo Copying files to www directory...
copy index.html www\ >nul
copy game.js www\ >nul
copy ai-engine.js www\ >nul
copy styles.css www\ >nul
copy manifest.json www\ >nul

REM Copy files to Capacitor
echo Copying to Android project...
npx cap copy android

echo Build complete! You can now run:
echo npx cap open android
pause