import * as THREE from 'three';

type BorderedFlatVoxelMaterialOptions = {
  voxelSize?: number;
  borderColor?: THREE.ColorRepresentation;
  borderSize?: number;
  borderFeather?: number;
};

export function createBorderedFlatVoxelMaterial(
  options: BorderedFlatVoxelMaterialOptions = {},
): THREE.MeshLambertMaterial {
  const voxelSize = options.voxelSize ?? 1;
  const borderColor = new THREE.Color(options.borderColor ?? 0x3a3a3a);
  const borderSize = options.borderSize ?? 0.14;
  const borderFeather = options.borderFeather ?? 0.025;
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
  });

  material.customProgramCacheKey = () =>
    `${voxelSize}:${borderColor.getHexString()}:${borderSize}:${borderFeather}`;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.voxelSize = { value: voxelSize };
    shader.uniforms.borderColor = { value: borderColor };
    shader.uniforms.borderSize = { value: borderSize };
    shader.uniforms.borderFeather = { value: borderFeather };

    shader.vertexShader =
      `
      uniform float voxelSize;
      varying vec3 vLocalPosition;
      varying vec3 vLocalNormal;
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vLocalPosition = position / voxelSize + vec3(0.5);
      vLocalNormal = normal;
      `,
    );

    shader.fragmentShader =
      `
      uniform vec3 borderColor;
      uniform float borderSize;
      uniform float borderFeather;
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
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      vec2 faceUv = clamp(localFaceUv(vLocalPosition, normalize(vLocalNormal)), 0.0, 1.0);
      float edgeDistance = min(
        min(faceUv.x, faceUv.y),
        min(1.0 - faceUv.x, 1.0 - faceUv.y)
      );
      float borderMask = 1.0 - smoothstep(borderSize, borderSize + borderFeather, edgeDistance);
      diffuseColor.rgb = mix(diffuseColor.rgb, borderColor, borderMask);
      `,
    );
  };

  material.needsUpdate = true;
  return material;
}
