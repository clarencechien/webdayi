# WebDaYi PWA Icons

This directory should contain PWA icons in various sizes for different devices.

## Required Icon Sizes

The following icon sizes are referenced in `manifest.json`:

- `icon-72x72.png` - Small mobile icon
- `icon-96x96.png` - Mobile icon, also used in shortcuts
- `icon-128x128.png` - Medium mobile icon
- `icon-144x144.png` - iPad icon
- `icon-152x152.png` - iPad Retina icon
- `icon-192x192.png` - Standard PWA icon
- `icon-384x384.png` - Large icon
- `icon-512x512.png` - Splash screen icon

## Generating Icons

You can generate these icons using one of the following methods:

### Method 1: Using ImageMagick

```bash
# Install ImageMagick
sudo apt-get install imagemagick

# Generate icons from a base icon (replace base-icon.png with your source)
for size in 72 96 128 144 152 192 384 512; do
  convert base-icon.png -resize ${size}x${size} icon-${size}x${size}.png
done
```

### Method 2: Using Online Tools

- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Method 3: Manual Design

Design each icon manually using tools like:
- Figma
- Adobe Illustrator
- Inkscape (free, open-source)

## Icon Design Guidelines

- Use a simple, recognizable symbol
- Ensure good contrast for both light and dark backgrounds
- The icon should represent the "Dàyì" (大易) input method
- Consider using the Chinese character "易" as the main element
- Use the app's theme color: #4ec9b0 (teal/cyan)

## Temporary Workaround

Until proper icons are created, the PWA will still function, but:
- Browser console will show 404 errors for missing icons
- The app won't have a custom icon when installed
- The default browser icon will be used instead
