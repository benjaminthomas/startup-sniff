# Social Media Images Guide

## 📁 Available Images

### Static SVG Images (Created)
- `og-image.svg` - Open Graph image (1200x630) for Facebook, LinkedIn
- `twitter-image.svg` - Twitter Card image (1200x630)
- `favicon.svg` - Browser favicon (32x32)
- `apple-touch-icon.svg` - Apple Touch Icon (180x180)

### Dynamic Next.js Generators (In app/ folder)
- `app/opengraph-image.tsx` - Generates OG image on-the-fly
- `app/twitter-image.tsx` - Generates Twitter image on-the-fly
- `app/icon.tsx` - Generates favicon on-the-fly

---

## ⚡ Approach 1: Dynamic Images (Recommended)

**Pros:**
- ✅ No manual image generation needed
- ✅ Easy to update (just edit TSX file)
- ✅ Next.js handles optimization automatically
- ✅ Lighter repository (no large image files)

**How it works:**
- Next.js automatically generates images from `.tsx` files
- Images are served at: `/opengraph-image`, `/twitter-image`, `/icon`
- Changes to TSX files instantly update images

**Current status:** ✅ Already configured in `app/layout.tsx`

---

## 🖼️ Approach 2: Static Images

**Pros:**
- ✅ More control over exact appearance
- ✅ Faster first load (pre-generated)
- ✅ Works with all build systems

**Cons:**
- ❌ Must convert SVG → PNG manually
- ❌ Larger repository size
- ❌ Harder to update (regenerate images)

### Converting SVG to PNG

#### Method 1: Online Tool
1. Visit: https://svgtopng.com/
2. Upload `og-image.svg`
3. Download as PNG (1200x630)
4. Save as `og-image.png` in `public/` folder

#### Method 2: ImageMagick (Command Line)
```bash
# Install ImageMagick first
convert public/og-image.svg -resize 1200x630 public/og-image.png
convert public/twitter-image.svg -resize 1200x630 public/twitter-image.png
convert public/favicon.svg -resize 32x32 public/favicon.png
convert public/apple-touch-icon.svg -resize 180x180 public/apple-touch-icon.png
```

#### Method 3: Figma/Photoshop
1. Open SVG in Figma or Photoshop
2. Export as PNG with dimensions:
   - OG Image: 1200 x 630px
   - Twitter Image: 1200 x 630px
   - Favicon: 32 x 32px
   - Apple Touch Icon: 180 x 180px

### Update Metadata to Use Static Images

If you want to use static PNG images instead of dynamic generators:

**Edit `app/layout.tsx`:**
```typescript
openGraph: {
  // ...
  images: [
    {
      url: '/og-image.png',  // Changed from /opengraph-image
      width: 1200,
      height: 630,
      alt: "StartupSniff - AI-Powered Startup Ideas & Validation",
    },
  ],
},
twitter: {
  // ...
  images: ['/twitter-image.png'],  // Changed from /twitter-image
},
icons: {
  icon: [
    { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
  ],
  apple: [
    { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ],
},
```

**Then delete the dynamic generators:**
```bash
rm app/opengraph-image.tsx
rm app/twitter-image.tsx
rm app/icon.tsx
```

---

## 🎨 Customizing Images

### SVG Files
Edit the SVG files directly in `public/` folder:
- Change colors in `<linearGradient>` tags
- Update text in `<text>` tags
- Adjust sizes and positioning

### Dynamic Generators
Edit the TSX files in `app/` folder:
- Change styles in the `style` objects
- Update text content
- Modify layout and colors

---

## 🧪 Testing

### Dynamic Images (Current Setup)
Visit these URLs to see generated images:
- http://localhost:3000/opengraph-image
- http://localhost:3000/twitter-image
- http://localhost:3000/icon

### Static Images
If using static approach, visit:
- http://localhost:3000/og-image.svg (or .png)
- http://localhost:3000/twitter-image.svg (or .png)
- http://localhost:3000/favicon.svg (or .png)

### Social Media Preview
Test how your images appear:
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

---

## 📊 Current Recommendation

**Use Dynamic Images (Approach 1)** because:
1. Already configured and working
2. Easier to maintain
3. Smaller repository
4. Next.js 16 optimizes them automatically

**Only switch to Static Images if:**
- You need very specific PNG optimization
- Your hosting doesn't support Next.js dynamic features
- You want to use external image CDN

---

## ✅ What's Already Working

Your current setup uses **Dynamic Images**:
- ✅ `app/opengraph-image.tsx` → Generates OG image
- ✅ `app/twitter-image.tsx` → Generates Twitter image
- ✅ `app/icon.tsx` → Generates favicon
- ✅ Metadata in `app/layout.tsx` points to dynamic routes
- ✅ No manual PNG conversion needed
- ✅ Images update automatically when you edit TSX files

**You don't need to do anything else** - it's already working! 🎉

The SVG files I created are **optional alternatives** if you decide to switch approaches later.
