---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of production-grade frontend interfaces that are both visually distinctive and genuinely usable. The goal is real working code with strong aesthetics AND excellent user experience — beauty that serves the user, not just impresses them.

## Step 1: Understand the Context

Before writing any code, figure out what you're building and calibrate accordingly:

- **Purpose**: What problem does this solve? Who uses it, and how often?
- **Interface type**: This determines the design intensity (see below).
- **Constraints**: Framework, existing design system, performance needs, accessibility requirements.

### Design Intensity

Not every interface needs the same level of visual boldness. Match the aesthetic ambition to the context:

| Context | Intensity | What this means |
|---|---|---|
| **Landing pages, portfolios, marketing** | High | Go bold. Strong visual personality, creative layouts, striking typography, memorable moments. This is where you make an impression. |
| **Apps, dashboards, admin panels** | Medium | Clean and professional with personality in the details. Clear hierarchy, predictable patterns, subtle polish. Users spend hours here — don't tire their eyes. |
| **Forms, data tables, settings pages** | Low | Invisible design. Clarity, spacing, and readability above all. The UI should disappear so the content can shine. |
| **Components and widgets** | Contextual | Match the parent interface. A card for a dashboard should be clean; a card for a portfolio can be expressive. |

When the user doesn't specify, default to medium intensity. You can always ask or infer from the description.

## Step 2: Design Thinking

With the intensity calibrated, commit to an aesthetic direction:

- **Tone**: Brutally minimal, retro-futuristic, organic/natural, luxury/refined, playful, editorial, brutalist, art deco, soft/pastel, industrial — there are many flavors. Pick one that fits the context and commit to it.
- **Differentiation**: What gives this design its character? One or two signature choices (a distinctive font pairing, an unusual color accent, an elegant animation) go further than piling on effects.

**Key principle**: Intentionality over intensity. A restrained design with perfect spacing and one beautiful font is more impressive than a busy design with five competing effects. Choose a direction and execute it with precision.

## Step 3: UX Fundamentals

Every interface, regardless of design intensity, must nail these basics. Skipping them creates something that looks good in a screenshot but frustrates real users:

- **Visual hierarchy**: The user's eye should flow naturally. Use size, weight, color, and spacing to make it obvious what's most important, what's secondary, and what's supporting.
- **Navigation & wayfinding**: Users should always know where they are, how they got there, and how to get somewhere else. For multi-page layouts, include clear nav. For single-page, ensure logical scroll flow.
- **Interactive feedback**: Every clickable element needs a hover state. Buttons should feel responsive. Loading states, error states, empty states — account for them.
- **Readability**: Sufficient contrast (WCAG AA minimum). Line lengths under 75 characters for body text. Adequate font size (16px+ base). Proper line-height (1.4-1.6 for body).
- **Responsive design**: Build mobile-first or ensure graceful degradation. Test that layouts don't break at common breakpoints (640px, 768px, 1024px, 1280px).
- **Accessibility**: Semantic HTML elements, meaningful alt text, keyboard navigability, focus indicators. These aren't extras — they're baseline requirements.

## Step 4: Frontend Aesthetics

With UX handled, layer on the visual craft:

- **Typography**: Choose fonts with character. Avoid the overused defaults (Inter, Roboto, Arial, system fonts). Pair a distinctive display font with a readable body font. Google Fonts has great options — explore beyond the first page of popular results.
- **Color & Theme**: Build a cohesive palette using CSS variables. A dominant color with one or two sharp accents beats a timid, evenly-distributed palette. Consider both light and dark themes.
- **Motion**: Focus on high-impact moments. A well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions. Use CSS animations for HTML; Motion library for React. Hover states and scroll-triggered effects should surprise without distracting.
- **Spatial Composition**: Asymmetry, overlap, diagonal flow, and grid-breaking elements can create visual interest — but only at medium/high intensity. For low-intensity interfaces, prioritize alignment and consistent spacing.
- **Texture & Depth**: Gradient meshes, noise textures, geometric patterns, layered transparencies, subtle shadows. These add atmosphere when used with restraint. For low-intensity interfaces, skip them or use very subtly.

### Anti-Patterns to Avoid

- Generic AI aesthetics: purple gradients on white, cookie-cutter card grids, predictable hero-CTA-features layouts
- Converging on the same "safe" choices every time (Space Grotesk, Inter, the same blue-purple palette)
- Animations that delay usability (loading spinners that are actually just entrance animations, parallax that makes scrolling feel sluggish)
- Beautiful designs that hide the primary action or confuse the information hierarchy
- Decorative elements that add visual noise without serving the design concept

## Implementation

Write real, working code (HTML/CSS/JS, React, Vue, etc.) that is:
- **Functional first**: Everything works. Links go somewhere, buttons do things, forms validate.
- **Visually cohesive**: Every element belongs to the same design language.
- **Responsive**: Works on mobile through desktop.
- **Performant**: Prefer CSS animations over JS where possible. Optimize images. Minimize layout shifts.

Vary your choices across generations — different themes, fonts, color palettes, layout approaches. Each design should feel tailored to its specific context, not like a template with swapped colors.
