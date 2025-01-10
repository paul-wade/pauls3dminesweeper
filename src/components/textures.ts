import * as THREE from 'three';

// Create and configure textures
const textureLoader = new THREE.TextureLoader();

// We'll use this dirt texture from ambientCG (CC0 license)
const DIRT_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/ao.jpg';

let dirtTexture: THREE.Texture | null = null;

export const getDirtTexture = () => {
  if (!dirtTexture) {
    dirtTexture = textureLoader.load(DIRT_URL);
    dirtTexture.wrapS = THREE.RepeatWrapping;
    dirtTexture.wrapT = THREE.RepeatWrapping;
    dirtTexture.repeat.set(1, 1);
  }
  return dirtTexture;
};
