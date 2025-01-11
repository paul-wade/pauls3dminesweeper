// Game difficulty settings
export const DIFFICULTY_SETTINGS = {
  easy: { width: 8, height: 8, mines: 10 },
  medium: { width: 16, height: 16, mines: 40 },
  hard: { width: 24, height: 24, mines: 99 }
} as const;

// Layout configuration
export const LAYOUT = {
  container: {
    maxWidth: "1200px",  // Reduced further to avoid profile overlap
    padding: {
      base: "2rem",
      md: "4rem"
    }
  },
  mainContainer: {
    height: "1000px",  // Height of the main glass container
    padding: "2.5rem",
    borderRadius: "2xl",
    backdropBlur: "20px",
    background: "rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    border: "1px solid rgba(255, 255, 255, 0.18)"
  },
  gameBoard: {
    height: "100%",  // Fill parent height
    borderRadius: "2xl"
  },
  board: {
    scale: 1.2,
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    }
  },
  camera: {
    height: 20,
    padding: 2,
    near: 0.1,
    far: 1000,
    rotation: {
      x: -Math.PI / 3,
      y: Math.PI / 4,
      z: 0
    }
  },
  animation: {
    duration: 0.5,
    initialScale: 0.4,
    easing: "easeOut"
  }
} as const;

// Theme configuration
export const THEME = {
  colors: {
    background: {
      light: 'gray.50',
      dark: 'gray.900'
    },
    board: {
      light: 'gray.50',
      dark: 'gray.800'
    }
  },
  shadows: {
    board: "lg"
  }
} as const;

// Cell configuration
export const CELL = {
  colors: {
    unrevealed: 'gray.300',
    revealed: 'white',
    hover: 'gray.400'
  },
  numbers: {
    1: 'blue.500',
    2: 'green.500',
    3: 'red.500',
    4: 'purple.500',
    5: 'orange.500',
    6: 'teal.500',
    7: 'pink.500',
    8: 'cyan.500'
  }
} as const;
