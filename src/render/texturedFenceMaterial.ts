import * as THREE from 'three';

export function createTexturedFenceMaterial(
  atlas: THREE.Texture,
  gridSize: number,
  cellIndex: number,
): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
  });
  material.toneMapped = false;

  material.customProgramCacheKey = () => `fence:${gridSize}:${cellIndex}`;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.atlasMap = { value: atlas };
    shader.uniforms.atlasGridSize = { value: gridSize };
    shader.uniforms.cellIndex = { value: cellIndex };

    shader.fragmentShader =
      `
      uniform sampler2D atlasMap;
      uniform float atlasGridSize;
      uniform float cellIndex;
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      float cellX = mod(cellIndex, atlasGridSize);
      float cellY = floor(cellIndex / atlasGridSize);
      vec2 atlasUv = (vec2(cellX, cellY) + vMapUv) / atlasGridSize;
      vec4 sampledColor = texture2D(atlasMap, atlasUv);
      diffuseColor *= sampledColor;
      `,
    );
  };

  material.map = atlas;
  material.needsUpdate = true;
  return material;
}
