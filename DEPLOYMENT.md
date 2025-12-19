# Deployment Guide

This guide explains how to deploy AI Snake '95 to various platforms.

## 🚀 GitHub Pages (Recommended)

### Automatic Deployment
1. **Push to GitHub**: The included GitHub Actions workflow automatically deploys to GitHub Pages
2. **Enable Pages**: Go to Settings → Pages → Source: GitHub Actions
3. **Access**: Your game will be available at `https://your-username.github.io/ai-snake-95`

### Manual Deployment
1. **Build branch**: Create a `gh-pages` branch
2. **Copy files**: Copy all files to the branch
3. **Push**: Push the branch to GitHub
4. **Configure**: Set Pages source to `gh-pages` branch

## 🌐 Other Hosting Platforms

### Netlify
1. **Connect repository** to Netlify
2. **Build settings**: No build command needed
3. **Publish directory**: `/` (root)
4. **Deploy**: Automatic on push

### Vercel
1. **Import project** from GitHub
2. **Framework preset**: Other
3. **Build command**: Leave empty
4. **Output directory**: Leave empty
5. **Deploy**: Automatic on push

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Surge.sh
```bash
npm install -g surge
surge
```

## 📱 Mobile App (Optional)

### Cordova/PhoneGap
```bash
npm install -g cordova
cordova create ai-snake-95 com.yourname.aisnake95 "AI Snake 95"
# Copy web files to www/
cordova platform add android ios
cordova build
```

### Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
npx cap sync
```

## 🛠️ Local Development Server

### Python (Simple)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Node.js
```bash
npx http-server
# or
npm install -g http-server
http-server
```

### PHP
```bash
php -S localhost:8000
```

## 🔧 Build Optimization (Optional)

### Minification
```bash
# Install terser for JS minification
npm install -g terser

# Minify JavaScript
terser game.js -o game.min.js
terser ai-engine.js -o ai-engine.min.js

# Update HTML to use minified files
```

### Image Optimization
- Compress any images you add
- Use WebP format for better compression
- Optimize SVG files

### Caching Headers
Add to `.htaccess` (Apache) or server config:
```apache
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>
```

## 📊 Analytics (Optional)

### Google Analytics
Add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 🔒 Security Headers

Add security headers for production:
```
Content-Security-Policy: default-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## 📱 PWA (Progressive Web App)

To make it installable on mobile:

1. **Add manifest.json**:
```json
{
  "name": "AI Snake '95",
  "short_name": "AI Snake",
  "description": "Retro Snake game with AI",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#008080",
  "theme_color": "#000080",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

2. **Add service worker** for offline support
3. **Link manifest** in HTML

## 🚨 Troubleshooting

### Common Issues
- **CORS errors**: Use a local server, don't open HTML directly
- **Mobile touch issues**: Ensure viewport meta tag is correct
- **Performance**: Check browser dev tools for bottlenecks
- **Compatibility**: Test on multiple browsers and devices

### Debug Mode
Add `?debug=1` to URL for console logging:
```javascript
const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';
if (DEBUG) console.log('Debug info');
```

---

Choose the deployment method that best fits your needs! 🚀