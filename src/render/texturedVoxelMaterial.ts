import * as THREE from 'three';
import type { BlockFaceTextures } from '../textures/textureSet';

type TexturedVoxelMaterialOptions = {
  voxelSize?: number;
  alphaTest?: number;
  doubleSided?: boolean;
  tintColor?: THREE.ColorRepresentation;
  tintLightness?: number;
  toneMapped?: boolean;
};

export function createTexturedVoxelMaterial(
  atlas: THREE.Texture,
  gridSize: number,
  blockFaces: BlockFaceTextures,
  options: TexturedVoxelMaterialOptions,
): THREE.MeshLambertMaterial {
  const voxelSize = options.voxelSize ?? 1;
  const tintColor = new THREE.Color(options.tintColor ?? 0xffffff);
  const tintLightness = options.tintLightness ?? 0;
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: (options.alphaTest ?? 0) > 0,
    alphaTest: options.alphaTest ?? 0,
    side: options.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });
  material.toneMapped = options.toneMapped ?? false;

  material.customProgramCacheKey = () =>
    `${gridSize}:${blockFaces.top}:${blockFaces.bottom}:${blockFaces.side}:${voxelSize}:${tintColor.getHexString()}:${tintLightness}`;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.atlasMap = { value: atlas };
    shader.uniforms.atlasGridSize = { value: gridSize };
    shader.uniforms.topCellIndex = { value: blockFaces.top };
    shader.uniforms.bottomCellIndex = { value: blockFaces.bottom };
    shader.uniforms.sideCellIndex = { value: blockFaces.side };
    shader.uniforms.voxelSize = { value: voxelSize };
    shader.uniforms.tintColor = { value: tintColor };
    shader.uniforms.tintLightness = { value: tintLightness };

    shader.vertexShader =
      `
      attribute float instanceAxis;
      uniform float voxelSize;
      varying float vInstanceAxis;
      varying vec3 vLocalPosition;
      varying vec3 vLocalNormal;
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vInstanceAxis = instanceAxis;
      vLocalPosition = position / voxelSize + vec3(0.5);
      vLocalNormal = normal;
      `,
    );

    shader.fragmentShader =
      `
      uniform sampler2D atlasMap;
      uniform float atlasGridSize;
      uniform float topCellIndex;
      uniform float bottomCellIndex;
      uniform float sideCellIndex;
      uniform float voxelSize;
      uniform vec3 tintColor;
      uniform float tintLightness;
      varying float vInstanceAxis;
      varying vec3 vLocalPosition;
      varying vec3 vLocalNormal;

      vec2 localFaceUv(vec3 localPosition, vec3 normal) {
        if (abs(normal.x) > 0.5) {
          return vec2(normal.x > 0.0 ? 1.0 - localPosition.z : localPosition.z, localPosition.y);
        }
        if (abs(normal.y) > 0.5) {
          return vec2(localPosition.x, normal.y > 0.0 ? 1.0 - localPosition.z : localPosition.z);
        }
        return vec2(normal.z > 0.0 ? localPosition.x : 1.0 - localPosition.x, localPosition.y);
      }

      float atlasCellIndex(vec3 normal, float axis) {
        if (axis < 0.5) {
          return normal.y > 0.5 ? topCellIndex : normal.y < -0.5 ? bottomCellIndex : sideCellIndex;
        }
        if (axis < 1.5) {
          return normal.x > 0.5 ? topCellIndex : normal.x < -0.5 ? bottomCellIndex : sideCellIndex;
        }
        return normal.z > 0.5 ? topCellIndex : normal.z < -0.5 ? bottomCellIndex : sideCellIndex;
      }

      vec4 sampleAtlasColor(vec3 localPosition, vec3 localNormal, float axis) {
        vec3 faceNormal = normalize(localNormal);
        float cellIndex = atlasCellIndex(faceNormal, axis);
        vec2 faceUv = clamp(localFaceUv(localPosition, faceNormal), 0.0, 1.0);
        float cellX = mod(cellIndex, atlasGridSize);
        float cellY = floor(cellIndex / atlasGridSize);
        vec2 atlasUv = (vec2(cellX, cellY) + faceUv) / atlasGridSize;
        return texture2D(atlasMap, atlasUv);
      }
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      vec4 sampledDiffuseColor = sampleAtlasColor(vLocalPosition, vLocalNormal, vInstanceAxis);
      sampledDiffuseColor.rgb *= mix(tintColor, vec3(1.0), tintLightness);
      diffuseColor *= sampledDiffuseColor;
      `,
    );
  };

  material.map = atlas;
  material.needsUpdate = true;
  return material;
}
