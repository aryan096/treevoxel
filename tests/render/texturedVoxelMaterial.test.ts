import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { createTexturedVoxelMaterial } from '../../src/render/texturedVoxelMaterial';

const dummyAtlas = new THREE.Texture();
const dummyFaces = { top: 0, bottom: 0, side: 0 };

describe('createTexturedVoxelMaterial alphaToCoverage', () => {
  it('sets alphaToCoverage when option is true', () => {
    const mat = createTexturedVoxelMaterial(dummyAtlas, 8, dummyFaces, { alphaToCoverage: true });
    expect(mat.alphaToCoverage).toBe(true);
  });

  it('alphaToCoverage is false by default', () => {
    const mat = createTexturedVoxelMaterial(dummyAtlas, 8, dummyFaces, {});
    expect(mat.alphaToCoverage).toBe(false);
  });

  it('alphaToCoverage mode uses opaque rendering with no alphaTest', () => {
    const mat = createTexturedVoxelMaterial(dummyAtlas, 8, dummyFaces, { alphaToCoverage: true });
    expect(mat.transparent).toBe(false);
    expect(mat.alphaTest).toBe(0);
  });
});
