'use client';

import { ChakraProvider, Box } from '@chakra-ui/react';
import IsometricBoard from '../components/IsometricBoard';
import ProfessionalBackground from '../components/ProfessionalBackground';
import { LAYOUT } from '../config';

export default function Home() {
  return (
    <ChakraProvider>
      <Box 
        position="relative" 
        height="100vh"
        bgGradient="linear(to-br, purple.600, blue.400)"
        overflow="hidden"
        py={2}
        sx={{
          caretColor: 'transparent',
          userSelect: 'none',
          '*': {
            caretColor: 'transparent',
            userSelect: 'none'
          }
        }}
        _focus={{ outline: 'none' }}
        tabIndex={-1}
      >
        {/* Animated background shapes */}
        <Box
          position="fixed"
          top="-20%"
          left="-20%"
          width="140%"
          height="120%"
          zIndex={0}
          sx={{
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              animation: 'float 20s infinite linear',
            },
            '&::before': {
              background: 'radial-gradient(circle, rgba(255,0,255,0.3) 0%, rgba(255,0,255,0) 70%)',
              top: '10%',
              left: '20%',
            },
            '&::after': {
              background: 'radial-gradient(circle, rgba(0,255,255,0.3) 0%, rgba(0,255,255,0) 70%)',
              bottom: '10%',
              right: '20%',
              animationDelay: '-10s',
            },
            '@keyframes float': {
              '0%': { transform: 'rotate(0deg) translate(50px) rotate(0deg)' },
              '100%': { transform: 'rotate(360deg) translate(50px) rotate(-360deg)' },
            },
          }}
        />

        <Box 
          sx={{
            caretColor: 'transparent',
            userSelect: 'none',
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' }
          }}
        >
          <ProfessionalBackground />
        </Box>
        
        <Box 
          as="main" 
          position="relative"
          zIndex={1}
          height="100%" 
          p={4} 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center"
        >
          <Box
            height={LAYOUT.mainContainer.height}
            width="85%"
            maxWidth="1800px"
            maxHeight="90vh"
            bg={LAYOUT.mainContainer.background}
            backdropFilter={`blur(${LAYOUT.mainContainer.backdropBlur})`}
            borderRadius={LAYOUT.mainContainer.borderRadius}
            p={LAYOUT.mainContainer.padding}
            boxShadow={LAYOUT.mainContainer.boxShadow}
            border={LAYOUT.mainContainer.border}
            transform="perspective(1000px) rotateX(5deg)"
            _hover={{
              transform: "perspective(1000px) rotateX(0deg)",
              transition: "transform 0.3s ease-in-out"
            }}
          >
            <Box
              position="relative"
              height="100%"
              width="100%"
              overflow="hidden"
              p={0}
              _before={{
                content: '""',
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
                zIndex: -1,
                borderRadius: '2xl',
                opacity: 0.5,
                filter: 'blur(10px)',
              }}
            >
              <IsometricBoard initialWidth={12} initialHeight={12} initialMines={18} initialLevels={3} />
            </Box>
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
}
