# 3D Minesweeper

A modern take on the classic Minesweeper game, built with React, Next.js, and Three.js. Features an isometric 3D design, smooth animations, and a high-score system.

## Features

- 🎮 Advanced Game Architecture
  - Custom game state management system
  - Efficient board generation algorithm
  - Recursive flood-fill for tile revealing
  - Event-driven game mechanics
- 🎨 3D Graphics & Animation
  - Three.js-powered isometric rendering
  - Custom 3D models for mines and flags
  - Dynamic lighting and shadows
  - Physics-based explosion animations
- 🏗️ Modern Web Technologies
  - Next.js 13 with App Router
  - React Server Components
  - TypeScript for type safety
  - Tailwind CSS for styling
- 🎯 Performance Optimizations
  - React Three Fiber for efficient 3D rendering
  - Optimized component re-renders
  - Lazy loading of game assets
  - Memoized game calculations
- 🏆 Backend Integration
  - RESTful API for high scores
  - Persistent data storage
  - Score validation system
- 📱 Advanced UI/UX
  - Responsive 3D viewport
  - Keyboard and touch controls
  - Accessibility features
  - Windows 95/98-inspired design

## Technical Deep Dive

### 3D Rendering Architecture
The game uses a sophisticated 3D rendering system built on Three.js and React Three Fiber. Each cell is a custom 3D component with:
- Dynamic geometry generation
- Material system with PBR textures
- Custom shaders for effects
- Optimized instancing for performance

### Game Logic
- Custom recursive algorithms for tile revealing
- Efficient mine placement with guaranteed first-move safety
- Event-driven architecture for game state management
- TypeScript interfaces for type-safe game state

### Performance
- Optimized 3D scene with frustum culling
- Efficient state updates using React hooks
- Memoized calculations for board state
- Lazy-loaded components and assets

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/3d-minesweeper.git
```

2. Install dependencies:
```bash
cd 3d-minesweeper
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

- Left click to reveal a tile
- Right click to place/remove a flag
- The number on a revealed tile shows how many mines are adjacent to it
- Flag all mines and reveal all safe tiles to win

### Difficulty Levels

The game offers three difficulty levels:
- Easy: 8x8 board with 10 mines
- Medium: 16x16 board with 40 mines
- Hard: 24x24 board with 99 mines

Each difficulty level automatically adjusts the board scale and camera position for optimal viewing. The game maintains performance through efficient instance rendering, supporting up to 576 cells (24x24) for the hardest difficulty level.

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Basic understanding of 3D graphics concepts

### Development Commands
```bash
# Install dependencies with exact versions
npm ci

# Run development server with hot reload
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Run tests
npm run test
```

### Project Structure
```
src/
├── components/    # React components
│   ├── 3d/       # Three.js components
│   └── ui/       # UI components
├── hooks/        # Custom React hooks
├── utils/        # Helper functions
├── types/        # TypeScript definitions
└── app/          # Next.js 13 app directory
```

## License

MIT License - feel free to use this code for your own projects!
