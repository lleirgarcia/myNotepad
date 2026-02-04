# Design System

## Style Prototype: Todoist/Things-Inspired (Current)

The app uses a **warmer dark theme** inspired by popular todo apps (Todoist, Things 3). See **docs/TODO-APPS-DESIGN-REVIEW.md** for the design review and rationale.

### Component Library
- **Lucide React**: Modern icon library with consistent design
- **Tailwind CSS**: Utility-first CSS framework
- **Neutrals**: Zinc palette (warmer than slate)
- **Primary accent**: Amber (Todoist-style warmth)

### Color Palette (Prototype)

```css
Background: zinc-950 (Warm dark)
Foreground: zinc-50 (Off-white)
Primary: amber-500 (Warm accent for actions, active states)
Secondary: zinc-900 / zinc-800 (Surfaces, cards)
Border: zinc-700 / zinc-600
Muted: zinc-500 / zinc-400
Destructive: red-500 (Delete, errors)
Priority dots: red / yellow / cyan (unchanged)
```

### Key Features

1. **Mobile-First Design**
   - Viewport optimized for mobile devices
   - Touch-friendly buttons and inputs
   - Responsive layout that adapts to all screen sizes
   - PWA-ready meta tags for native app feel

2. **Dark Mode**
   - Eye-friendly dark colors
   - High contrast for readability
   - Professional aesthetic

3. **Modern UI Components**
   - Icon-based interactions
   - Smooth transitions and hover effects
   - Clean borders and spacing
   - Custom scrollbar styling

4. **Accessibility**
   - Clear visual hierarchy
   - Proper contrast ratios
   - Keyboard navigation support

### Typography
- System font stack for native feel
- Font smoothing enabled
- Consistent sizing scale

### Spacing & Layout
- 8px grid system
- Generous padding for touch targets (44px min touch targets on mobile)
- Rounded corners: `rounded-lg` (buttons, inputs), `rounded-xl` (cards, panels)

### Icons
Using Lucide React icons:
- CheckSquare, FileText (tabs)
- Plus, Edit2, Trash2, X, Save (actions)
- Circle, CheckCircle2 (todos)

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari (PWA capable)
- Android Chrome (PWA capable)
