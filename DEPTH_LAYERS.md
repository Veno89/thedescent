# UI Depth Layering System

This document explains the z-index/depth layering system used in The Descent to prevent overlapping UI elements.

## Layer Definitions (from Theme.layers)

```typescript
layers: {
  background: 0,    // Scene backgrounds, static images
  cards: 10,        // Player cards in hand, enemy sprites
  ui: 20,           // Standard UI elements, standalone text
  panels: 30,       // UICard containers, panels
  tooltips: 40,     // Tooltips, help text, instructions
  overlays: 50,     // Modal overlays (dark backgrounds)
  modals: 60,       // Modal content (on top of overlays)
}
```

## Depth Assignment Rules

### 1. **Background Elements (0-9)**
- Scene backgrounds: `0`
- Hand area background: `background + 5` (5)
- Decorative elements: `background + 1 to +9`

### 2. **Game Cards & Sprites (10-19)**
- Player cards in hand: `layers.cards` (10)
- Enemy sprites: `layers.cards` (10)
- Card dragging (temporary): `1000` (brought to front during drag)

### 3. **Standard UI (20-29)**
- Standalone buttons (default): `layers.ui` (20)
- Text labels: `layers.ui` (20)
- Progress bars: `layers.ui` (20)

### 4. **Panels & Cards (30-34)**
- UICard containers: `layers.panels` (30)
- Player stats card: `30`
- Turn info card: `30`
- Action bar card: `30`

### 5. **Interactive Elements Inside Panels (35-39)**
- **IMPORTANT**: Buttons inside UICards must be at higher depth than the card!
- Buttons in action bar: `panels + 5` (35)
- End Turn button: `panels + 5` (35)
- Any interactive element inside a UICard: `panels + 5`

### 6. **Tooltips & Instructions (40-49)**
- Instruction text: `layers.tooltips` (40)
- Help text: `layers.tooltips` (40)
- Hover tooltips: `layers.tooltips` (40)

### 7. **Overlays & Modals (50-60)**
- Modal background overlays: `layers.overlays` (50)
- Modal content (buttons, text): `layers.modals` (60)

## Common Issues & Solutions

### Problem: Buttons inside UICards are not visible
**Cause**: Buttons at default depth (20) are behind UICard (30)
**Solution**: Set button depth to `layers.panels + 5` (35)
```typescript
const button = new Button({...});
button.setDepth(Theme.layers.panels + 5);
```

### Problem: Instruction text hidden behind cards
**Cause**: Text at UI layer (20) is behind cards (10) or panels (30)
**Solution**: Set text depth to `layers.tooltips` (40)
```typescript
this.add.text(...).setDepth(Theme.layers.tooltips);
```

### Problem: Hand background covering cards
**Cause**: Hand background at wrong depth
**Solution**: Set to `layers.background + 5` (behind cards at 10)
```typescript
handBackground.setDepth(Theme.layers.background + 5);
```

## CombatScene Depth Map

```
Layer  Depth  Elements
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BG       0    Scene background
         5    Hand area background rectangle
CARDS   10    Player cards, Enemy sprites
UI      20    (Standalone UI elements - avoid for complex layouts)
PANELS  30    Player Stats Card, Turn Info Card, Action Bar Card
        35    End Turn Button, Action Bar Buttons (📚🗑️🗺️⚙️)
TOOLTIP 40    Instruction text at bottom
OVERLAY 50    Map/Options overlay backgrounds
MODAL   60    Map/Options overlay content & buttons
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Best Practices

1. **Always set depth explicitly** for important UI elements
2. **Interactive elements inside containers** should be at higher depth than container
3. **Use semantic layer names** from `Theme.layers` rather than magic numbers
4. **Document depth choices** in comments when non-obvious
5. **Test overlaps** by checking all UI states (hover, drag, open overlays)

## Migration Notes

When adding new UI elements:
- Check which layer they belong to conceptually
- If inside a container, add `+5` to container's depth
- Test visibility by toggling depth in browser console
- Update this document if adding new layer conventions
