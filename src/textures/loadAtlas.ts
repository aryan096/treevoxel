import * as THREE from 'three';

const atlasCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

export function loadAtlas(url: string | null): THREE.Texture | null {
  if (!url) {
    return null;
  }

  const cached = atlasCache.get(url);
  if (cached) {
    return cached;
  }

  const texture = loader.load(url);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.generateMipmaps = false;
  atlasCache.set(url, texture);
  return texture;
}
