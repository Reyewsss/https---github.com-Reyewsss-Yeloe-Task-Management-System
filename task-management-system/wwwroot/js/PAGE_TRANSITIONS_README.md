# Smooth Page Transitions - Simple Implementation

## What This Does
Adds smooth page transitions to your website without changing any existing HTML structure or design. The transitions are automatically applied to all page navigations.

## Features
✅ **Progress Bar** - Shows at the top of the page during navigation  
✅ **Subtle Loading Overlay** - Appears only if page takes longer than 150ms to load  
✅ **Smooth Fade-In** - Pages fade in smoothly when they load  
✅ **Dark Mode Support** - Automatically adapts to your dark mode theme  
✅ **Zero Configuration** - Works automatically, no setup needed  

## How It Works
1. User clicks any link → Progress bar starts animating
2. If page takes >150ms → Loading spinner appears
3. New page loads → Smooth fade-in effect
4. Everything resets for next navigation

## What's Automatically Excluded
The transition system smartly skips:
- External links (different domain)
- Hash links (#section)
- Download links
- Links with `target="_blank"`
- `mailto:` and `tel:` links
- Forms with `data-ajax` attribute

## Manual Exclusion (Optional)
To exclude specific links or forms from transitions:

```html
<a href="/page" data-no-transition>No Transition</a>
<form data-no-transition>...</form>
```

## Manual Control (For AJAX)
Use these global functions for AJAX requests:

```javascript
// Show transition manually
window.showPageTransition();

// Your AJAX call
fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        // Process data
    })
    .finally(() => {
        // Hide transition
        window.hidePageTransition();
    });
```

## Files Added
- `wwwroot/css/page-transitions.css` - Styles for transitions
- `wwwroot/js/page-transitions.js` - Transition logic

## Files Modified (minimal changes)
- `Views/Shared/_DashboardLayout.cshtml` - Added CSS and JS references
- `Views/Shared/_AuthLayout.cshtml` - Added CSS and JS references
- `Views/Shared/_Layout.cshtml` - Added CSS and JS references

**Note:** Only 2 lines added to each layout file - no structural changes!

## Customization (Optional)
Edit `page-transitions.js` if you want to adjust timing:

```javascript
const LOADER_DELAY = 150; // Change delay before showing loader (ms)
```

## Browser Support
Works in all modern browsers (Chrome, Firefox, Safari, Edge, Opera)

## Performance
- Lightweight (~3KB total)
- GPU-accelerated animations
- No impact on page load speed
- Elements created only when needed

## That's It!
The transitions are now working across your entire website. No further configuration needed!
