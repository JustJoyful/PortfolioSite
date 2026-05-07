# Frontend Design: Organic Glitch & Glass

## 1. Design Direction Summary
- **Aesthetic Name:** Cyber-Botanical Glassmorphism
- **DFII Score:** 12 (High Impact, Strong Context Fit, High Feasibility)
- **Key Inspiration:** The contrast between organic, delicate nature (the blooming peony) and digital imperfection (the glitch). The content floats above this duality in frosted glass containers, creating a sense of depth and modern elegance. 
- **Differentiation Callout:** This avoids generic UI by relying on a custom p5.js generative background that glitch-transitions, overlaid with liquid glassmorphism and a stark contrast between cursive elegance and terminal-inspired brutalism.

## 2. Design System Snapshot

### Typography
- **Expressive Cursive (Name):** `Alex Brush` or `Dancing Script` (Elegant, human, organic contrast to the glitch).
- **Restrained Body/Tech:** `Space Grotesk` (Geometric, slightly technical, legible).
- **Terminal/Code:** `Courier New` (To match the loader and terminal aesthetic of the projects).

### Color Variables
- `--bg-base`: `#000000` (Deep Space / Pitch Black)
- `--glass-bg`: `rgba(20, 20, 20, 0.45)` (Dark Frosted Glass)
- `--glass-border`: `rgba(255, 255, 255, 0.08)`
- `--accent-pink`: `#e9b` (Peony Pink from the sketch)
- `--accent-red`: `#c77` (Deep Peony Red)
- `--text-primary`: `#ffffff`
- `--text-secondary`: `rgba(255, 255, 255, 0.65)`

### Spacing & Rhythm
- High negative space around the central glass panels to allow the background animation to breathe.
- Asymmetrical layout: Project details might overlap slightly with their image/terminal window containers.
- Liquid glass panels will feature heavy backdrop blur (`backdrop-filter: blur(16px)`).

### Motion Philosophy
- The background p5.js animation handles the heavy lifting of continuous motion.
- Scrolling will use Framer Motion or pure CSS for a fluid, liquid feel.
- Elements will reveal themselves with subtle upward fades and glass-shimmer effects, avoiding jarring or bouncy micro-animations.

## 3. Project Structure (React + Vite + Tailwind)

```text
/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, icons, global fonts
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # GlassContainer, Section
│   │   ├── typography/     # CursiveTitle, Subtitle
│   │   └── ui/             # ProjectCard, TechBadge, SocialLinks
│   ├── hooks/              # Custom hooks
│   ├── sections/           # Page sections (Hero, About, Projects, Contact)
│   ├── sketch/             # The p5.js background animation logic
│   ├── App.tsx             # Main application orchestrator
│   └── index.css           # Global Tailwind & Custom CSS (Glassmorphism utilities)
├── tailwind.config.js      # Tailwind configuration with custom variables
└── package.json            # Project dependencies
```

## 4. Content Integration
- **Hero Section:** Full screen, clear. Scroll once -> Cursive "Joydeep Das", Subheading "Think. Then Build."
- **About Section:** Glass panel containing the bio (Student at NSEC, Tinkerer, hardware/gaming/linux).
- **Skills Section:** Technical skills (Python, C, C++, HTML, CSS, JSON, YAML) and IRL languages (English, Hindi, Bengali).
- **Projects Section:** Highlighting "AxiomLM" with a terminal-like design within the glass container.
- **Contact/Links:** GitHub, LinkedIn, Emails.
