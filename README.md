
# Stellar Genesis

A cinematic space clicker and progression game built in React + TypeScript, inspired by a Figma-first design process and shaped with AI-assisted ideation before the code was written.

Stellar Genesis blends atmospheric sci-fi presentation with incremental gameplay: players grow a solar system, unlock planets, research technologies, automate production, and push toward an eventual cosmic endgame.

## Project vision

This project started as an idea built around a premium, mature space-game aesthetic rather than a simple mobile clicker. The design language was first explored in Figma and refined through structured prompts and concept iteration to define:

- the visual tone and art direction
- the game loop and progression structure
- the UX flow between intro, gameplay, upgrades, and prestige
- the fictional narrative of building a living star system

The core design brief was then translated into a playable browser game with a strong emphasis on atmosphere, feedback, and long-form progression.

## Workflow: from concept to code

### 1. Figma concepting

The visual direction was established in Figma using a space-focused moodboard, composition studies, and interface layout exploration. The project leans into:

- deep navy space scenes
- soft blue cosmic clouds and atmospheric gradients
- premium sci-fi UI panels
- warm orange accents for key actions and progression moments
- a cinematic observation-room start screen

This gave the project a clear art direction before implementation began.

### 2. AI-assisted ideation with Claude

Claude was used to shape the creative and product direction before coding. This included refining the game concept, defining the progression arc, structuring a full systems breakdown, and helping turn the Figma direction into a practical design brief.

That process helped translate the idea into a solid game framework around:

- planetary evolution
- resource and upgrade progression
- automation systems
- prestige loops
- persistent save progression

### 3. Building the actual game

Once the concept had direction, the project was implemented as a React + Vite app with TypeScript and an interactive game state architecture. The result is a compact but feature-rich incremental game that keeps the visual identity of the original concept while making the mechanics playable.

## Current gameplay features

- Cinematic intro experience with a futuristic observation deck
- Core clicker-based resource generation
- Planet progression and evolution through multiple stages
- Research and technology tree progression
- Upgrade systems with increasing power and efficiency
- Automation nodes and passive production gains
- Achievements and progression milestones
- Prestige and rebirth mechanics for long-term replayability
- Offline save/continue support
- Persistent state using local save logic
- Responsive sci-fi interface with polished motion and ambient feedback

## Tech stack

- React
- TypeScript
- Vite
- Zustand for game state
- Tailwind-inspired styling and component-driven UI
- Custom game systems for economy, progression, and persistence

## Project structure

- src/app — main UI and screen flow
- src/game-data — balance, upgrades, planets, research, automation, prestige data
- src/store — game state management
- src/hooks — game loop and save system
- src/utilities — economy, production, formatting, progression helpers
- src/types — game data model

## Local development

Install dependencies:

```bash
npm install
```

Start the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Design philosophy

The project is intentionally designed to feel more like a polished sci-fi experience than a typical simple idle game. The presentation emphasizes:

- atmosphere over noise
- progression over clutter
- narrative fantasy over generic UI dashboards
- premium visuals with restrained motion and light

This creates a sense of discovery and scale as the player expands from a single world toward a broader cosmic civilization.

## Future steps

This project already has a strong foundation, and the roadmap can expand in several directions:

### Gameplay
- add more planets, star classes, and biomes
- expand advanced research and specialization systems
- introduce deeper economy balancing and late-game power curves
- add new progression milestones and endgame content

### Presentation
- refine motion and cinematic transitions
- add richer audio cues and ambient space sound
- improve accessibility and UI clarity for larger progression trees

### Systems
- add richer event chains and narrative moments
- support deeper save/import/export flows
- expand achievements and post-prestige progression goals

## Notes

This project is a strong example of a design-driven development workflow: concept → visual prototype → AI-assisted planning → playable implementation. It was built to feel like a premium concept game while staying modular and expandable for future feature work.

## Credits

This project is inspired by the original Figma concept and design brief for Stellar Genesis, then translated into a playable browser experience.
