# Character Background Images

This directory contains character images that are used as background images for the character selection cards.

## Updated Design with Enhanced Visibility

The character selection now uses lighter overlays to make the background images more visible while maintaining text readability.

### Design Features:

1. **Visible Background Images**: Reduced overlay opacity to showcase character images
2. **Smart Text Containers**: Enhanced glass-morphism containers for text readability
3. **Balanced Contrast**: Lighter overlays (40-60% opacity) with stronger text backgrounds
4. **Dynamic Overlays**: Different opacity levels for selected vs unselected states
5. **Enhanced Blur Effects**: Stronger backdrop-blur for better text separation

### Current Overlay System:

**Background Gradient:**
```css
linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.6) 100%)
```

**Text Container Backgrounds:**
- `bg-black/60` with `backdrop-blur-md` for descriptions
- `bg-black/70` with enhanced blur for icons
- Border accents with `border-white/10` for subtle definition

### Opacity Levels:

- **Unselected Cards**: 80% overlay opacity (lighter background visibility)
- **Selected Cards**: 60% overlay opacity (enhanced background visibility)
- **Text Containers**: 60-70% background opacity with strong blur effects

### Image Requirements for Optimal Results:

- **Contrast**: Images with good contrast work best with lighter overlays
- **Detail**: High-detail images will show through the reduced overlay
- **Color**: Vibrant colors will be more visible with the new opacity levels
- **Composition**: Consider text placement areas when designing character images

This approach provides the perfect balance between showcasing character artwork and maintaining excellent text readability.