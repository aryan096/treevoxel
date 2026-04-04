import * as THREE from 'three';

const atlasCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

export function configureAtlasTexture(texture: THREE.Texture): void {
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.generateMipmaps = true;
}

export function loadAtlas(url: string | null): THREE.Texture | null {
  if (!url) {
    return null;
  }

  const cached = atlasCache.get(url);
  if (cached) {
    return cached;
  }

  const texture = loader.load(url);
  configureAtlasTexture(texture);
  atlasCache.set(url, texture);
  return texture;
}
