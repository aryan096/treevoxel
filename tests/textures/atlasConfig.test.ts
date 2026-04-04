import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { configureAtlasTexture } from '../../src/textures/loadAtlas';

describe('configureAtlasTexture', () => {
  it('uses NearestMipmapLinearFilter for minFilter', () => {
    const tex = new THREE.Texture();
    configureAtlasTexture(tex);
    expect(tex.minFilter).toBe(THREE.NearestMipmapLinearFilter);
  });

  it('keeps NearestFilter for magFilter', () => {
    const tex = new THREE.Texture();
    configureAtlasTexture(tex);
    expect(tex.magFilter).toBe(THREE.NearestFilter);
  });

  it('enables generateMipmaps', () => {
    const tex = new THREE.Texture();
    configureAtlasTexture(tex);
    expect(tex.generateMipmaps).toBe(true);
  });

  it('sets SRGBColorSpace and disables flipY', () => {
    const tex = new THREE.Texture();
    configureAtlasTexture(tex);
    expect(tex.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(tex.flipY).toBe(false);
  });
});
