# 🎨 Quick Design Reference Guide

## Color Codes

```
Primary Blue:      #0066cc
Primary Dark:      #004a99
Primary Light:     #4d94ff
Accent Teal:       #00b8a9
Accent Dark Teal:  #008876

White:             #ffffff
Light Gray:        #f0f4f8
Lighter Gray:      #e8eef5
Border Gray:       #dee2e6

Text Primary:      #0a1428
Text Secondary:    #495057
Text Muted:        #6c757d

Success Green:     #198754
Error Red:         #dc3545
Warning Yellow:    #ffc107
Info Cyan:         #0dcaf0
```

## Common Patterns

### Gradient Header
```jsx
background: 'linear-gradient(135deg, #0066cc 0%, #00b8a9 100%)'
color: '#fff'
padding: '40px 20px'
borderRadius: '16px'
boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)'
```

### Card
```jsx
backgroundColor: '#fff'
padding: '30px'
borderRadius: '16px'
boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
border: '1px solid #e9ecef'
```

### Large Button
```jsx
padding: '16px 24px'
fontSize: '1rem'
fontWeight: '700'
borderRadius: '12px'
background: 'linear-gradient(135deg, #0066cc, #004a99)'
color: '#fff'
border: 'none'
cursor: 'pointer'
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
textTransform: 'uppercase'
letterSpacing: '0.5px'
```

### Microphone Button (200×200)
```jsx
width: '200px'
height: '200px'
borderRadius: '50%'
border: '4px solid #fff'
boxShadow: '0 0 0 6px #fff, 0 0 0 12px rgba(0, 102, 204, 0.2)'
background: 'linear-gradient(135deg, #0066cc, #004a99)'
color: '#fff'
fontSize: '1.2rem'
fontWeight: '700'
cursor: 'pointer'
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
```

### Message Display Text
```jsx
fontSize: '1.8rem'  // or 2rem for extra large
fontWeight: '700'
color: '#0a1428'
lineHeight: '1.4'
wordWrap: 'break-word'
wordBreak: 'break-word'
margin: '15px 0'
```

### Input/Transcript Box
```jsx
backgroundColor: '#e8eef5'
border: '2px solid #dee2e6'
borderRadius: '12px'
padding: '20px'
minHeight: '80px'
display: 'flex'
alignItems: 'center'
justifyContent: 'center'
```

## Spacing Scale
```
4px  = xs
8px  = sm
16px = md  (standard)
24px = lg  (section)
32px = xl
48px = xxl
```

## Border Radius Scale
```
4px   = sm
8px   = md
12px  = lg  (cards, buttons)
16px  = xl  (large containers)
9999px = full (pills)
```

## Typography

**Font Family**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif

**Sizes**:
- 14px: small labels
- 16px: body text (default)
- 18px: large body
- 24px: section titles
- 32px: page subtitles
- 48px: main page titles

**Weights**:
- 400: normal
- 500: medium (buttons)
- 600: semibold (labels, important)
- 700: bold (headings, emphasis)

**Line Height**: 1.6 (body), 1.1 (headings)

## Shadow Scale
```
0 1px 3px rgba(0, 0, 0, 0.08)     = sm
0 4px 12px rgba(0, 0, 0, 0.12)    = md  (standard)
0 8px 24px rgba(0, 0, 0, 0.16)    = lg
0 12px 32px rgba(0, 0, 0, 0.2)    = xl
```

## Transitions
```
Standard: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Fast:     all 0.15s cubic-bezier(0.4, 0, 0.2, 1)
```

## Accessibility Checklist

- ✅ Contrast ratio ≥ 7:1 for large text
- ✅ Contrast ratio ≥ 4.5:1 for normal text
- ✅ Font size ≥ 16px for body
- ✅ Line height ≥ 1.5
- ✅ Focus outline: 3px solid primary color
- ✅ Touch targets ≥ 50px
- ✅ Motion respects `prefers-reduced-motion`

## Using CSS Variables

In JSX:
```jsx
style={{
  color: 'var(--color-primary)',
  fontSize: 'var(--font-size-xl)',
  padding: 'var(--spacing-lg)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  transition: 'var(--transition)',
}}
```

In CSS:
```css
.button {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

## Component Structure Example

```jsx
<div style={styles.container}>
  {/* Header */}
  <header style={styles.header}>
    <h1 style={styles.title}>Title</h1>
    <p style={styles.subtitle}>Subtitle</p>
  </header>

  {/* Main Content */}
  <main style={styles.mainContent}>
    {/* Card Section */}
    <section style={styles.card}>
      <h2 style={styles.sectionTitle}>Section</h2>
      <div style={styles.messageBox}>
        <p style={styles.label}>Label:</p>
        <p style={styles.textDisplay}>Content</p>
      </div>
    </section>
  </main>
</div>
```

## Common Style Objects

```jsx
const styles = {
  container: {
    backgroundColor: 'var(--color-bg-secondary)',
    minHeight: '100vh',
    padding: 'var(--spacing-md)',
  },
  
  header: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
    color: '#fff',
    padding: '40px 20px',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
  },
  
  card: {
    backgroundColor: 'var(--color-bg-primary)',
    padding: 'var(--spacing-lg)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--color-border-light)',
  },
  
  button: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    fontSize: 'var(--font-size-lg)',
    fontWeight: '700',
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
};
```

## Hover Effects

**Button Hover**:
```jsx
':hover:not(:disabled)': {
  transform: 'translateY(-2px)',
  boxShadow: 'var(--shadow-lg)',
}
```

**Card Hover**:
```jsx
':hover': {
  boxShadow: 'var(--shadow-lg)',
  transform: 'translateX(4px)',
}
```

**Message Box Hover**:
```jsx
':hover': {
  transform: 'translateX(4px)',
  boxShadow: 'var(--shadow-md)',
}
```

## Responsive Tips

```jsx
// Mobile first
flex: '1 1 100%'

// Desktop
flex: '1 1 280px'

// With media query
display: 'flex',
flexWrap: 'wrap',
gap: 'var(--spacing-md)',
```

## Accessibility Focus

```jsx
':focus-visible': {
  outline: '3px solid var(--color-primary)',
  outlineOffset: '2px',
}
```

## Status Indicators

```jsx
// Online
color: 'var(--color-success)',
backgroundColor: 'rgba(25, 135, 84, 0.1)',

// Offline
color: 'var(--color-error)',
backgroundColor: 'rgba(220, 53, 69, 0.1)',

// Recording
backgroundColor: 'linear-gradient(135deg, var(--color-error), #bb2d3b)',
```

---

**Need Help?** See `DESIGN_SYSTEM.md` for complete documentation!
