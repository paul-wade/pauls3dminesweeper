'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Box, Text, VStack, HStack, Heading, Link, Collapse, Icon } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

const ExperienceCard: React.FC<{
  year: string;
  role: string;
  company: string;
  highlights: string;
  details: string[];
}> = ({ year, role, company, highlights, details }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box
      width="100%"
      p={3}
      bg="rgba(255, 255, 255, 0.1)"
      borderRadius="lg"
      border="1px solid rgba(255, 255, 255, 0.18)"
      transition="all 0.3s ease"
      cursor="pointer"
      position="relative"
      _hover={{
        bg: "rgba(255, 255, 255, 0.15)",
        transform: "translateX(-5px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={1}>
          <Text 
            fontSize="xs" 
            color="whiteAlpha.700"
            mb={1}
          >
            {year}
          </Text>
          <Text 
            fontSize="sm" 
            color="white"
            fontWeight="semibold"
          >
            {role}
          </Text>
          <Text 
            fontSize="xs" 
            color="whiteAlpha.900"
            mb={1}
          >
            {company}
          </Text>
          <Text
            fontSize="xs"
            color="whiteAlpha.800"
            fontStyle="italic"
          >
            {highlights}
          </Text>
        </VStack>
        <Icon
          as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
          color="whiteAlpha.800"
          w={5}
          h={5}
          transition="all 0.3s ease"
          transform={isExpanded ? "rotate(0deg)" : "rotate(0deg)"}
        />
      </HStack>
      
      <Collapse in={isExpanded} animateOpacity>
        <VStack align="start" mt={3} pl={3} spacing={2}>
          {details.map((detail, index) => (
            <Text
              key={index}
              fontSize="xs"
              color="whiteAlpha.900"
              pl={2}
              borderLeft="2px solid rgba(255, 255, 255, 0.2)"
              _hover={{
                borderLeft: "2px solid rgba(255, 255, 255, 0.5)",
                color: "white",
              }}
            >
              {detail}
            </Text>
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
};

const ProfessionalBackground: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const experiences = [
    {
      year: '2024-Present',
      role: 'Senior Software Engineer',
      company: 'Headset.io',
      highlights: 'Cloud Architecture, Full Stack Development',
      details: [
        'Leading cloud architecture and system design initiatives',
        'Building scalable full-stack solutions',
        'Driving technical best practices',
        'Collaborating with cross-functional teams on product development'
      ]
    },
    {
      year: '2022-2024',
      role: 'IT & Development Manager',
      company: 'BDSA',
      highlights: 'Cloud Architecture, System Design, Team Leadership',
      details: [
        'Managed IT infrastructure and cloud services',
        'Led development of enterprise data systems',
        'Improved system performance and reliability',
        'Streamlined development processes and workflows'
      ]
    },
    {
      year: '2021-2022',
      role: 'Senior Software Engineer Technical Lead',
      company: 'BDSA',
      highlights: 'Software Development, Database Architecture',
      details: [
        'Developed internal administration tools',
        'Led platform modernization initiatives',
        'Established CI/CD practices and DevOps workflows',
        'Mentored junior developers and engineers'
      ]
    }
  ];

  return (
    <Box
      position="fixed"
      right="0"
      top="0"
      width={isExpanded ? "400px" : "auto"}
      p={4}
      bg="rgba(0, 0, 0, 0.85)"
      backdropFilter="blur(10px)"
      borderLeft="1px solid rgba(255, 255, 255, 0.18)"
      borderBottom="1px solid rgba(255, 255, 255, 0.18)"
      borderBottomLeftRadius="xl"
      zIndex={2}
      transition="all 0.3s ease"
      _hover={{ bg: "rgba(0, 0, 0, 0.9)" }}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" cursor="pointer" onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}>
          <VStack align="start" spacing={0}>
            <Heading size="md" color="white">Paul Wade</Heading>
            <Text fontSize="sm" color="whiteAlpha.900">Senior Technology Engineer</Text>
            {!isExpanded && (
              <Text fontSize="xs" color="whiteAlpha.800">
                Leadership | System Design | Engineering | Cloud
              </Text>
            )}
          </VStack>
          <Icon
            as={isExpanded ? ChevronDownIcon : ChevronUpIcon}
            color="whiteAlpha.800"
            w={6}
            h={6}
          />
        </HStack>

        <Collapse in={isExpanded} animateOpacity>
          <VStack align="stretch" spacing={6}>
            {experiences.map((exp, index) => (
              <ExperienceCard key={index} {...exp} />
            ))}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default ProfessionalBackground;
