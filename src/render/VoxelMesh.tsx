import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { createTexturedVoxelMaterial } from './texturedVoxelMaterial';
import { createTexturedFenceMaterial } from './texturedFenceMaterial';
import { getLeafTintColor } from './leafTint';
import { useTreeStore } from '../store/treeStore';
import { loadAtlas } from '../textures/loadAtlas';
import { MINECRAFT_ATLAS_DEFINITION } from '../textures/minecraftAtlas';
import { createFencePostGeometry, createFenceNSRailGeometry, createFenceEWRailGeometry } from './fenceGeometry';

type MeshRefs = {
  log: THREE.InstancedMesh | null;
  branch: THREE.InstancedMesh | null;
  leaf: THREE.InstancedMesh | null;
  fencePost: THREE.InstancedMesh | null;
  fenceNSRail: THREE.InstancedMesh | null;
  fenceEWRail: THREE.InstancedMesh | null;
};

type CubeInstanceData = {
  counts: {
    log: number;
    branch: number;
    leaf: number;
  };
  axes: {
    log: Float32Array;
    branch: Float32Array;
    leaf: Float32Array;
  };
};

const MATERIAL_ROUGHNESS = {
  log: 0.95,
  branch: 0.92,
  leaf: 0.85,
  fence: 0.92,
} as const;

const DEFAULT_BLOCK_TEXTURES = {
  log: MINECRAFT_ATLAS_DEFINITION.blockTextures.oak_log,
  branch: MINECRAFT_ATLAS_DEFINITION.blockTextures.oak_log,
  leaf: MINECRAFT_ATLAS_DEFINITION.blockTextures.oak_leaves,
} as const;

export default function VoxelMesh() {
  const meshRefs = useRef<MeshRefs>({
    log: null,
    branch: null,
    leaf: null,
    fencePost: null,
    fenceNSRail: null,
    fenceEWRail: null,
  });
  const buffer = useTreeStore((s) => s.buffer);
  const showLog = useTreeStore((s) => s.display.showLog);
  const showBranch = useTreeStore((s) => s.display.showBranch);
  const showLeaf = useTreeStore((s) => s.display.showLeaf);
  const textureSet = useTreeStore((s) => s.textureSet);
  const minecraftPalette = useTreeStore((s) => s.minecraftPalette);
  const invalidate = useThree((s) => s.invalidate);
  const glCapabilities = useThree((s) => s.gl.capabilities);
  const isMinecraftTextureMode = textureSet === 'minecraft';

  const logGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const branchGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const leafGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const fencePostGeometry = useMemo(() => createFencePostGeometry(), []);
  const fenceNSRailGeometry = useMemo(() => createFenceNSRailGeometry(), []);
  const fenceEWRailGeometry = useMemo(() => createFenceEWRailGeometry(), []);
  const logMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: MATERIAL_ROUGHNESS.log,
        metalness: 0,
      }),
    [],
  );
  const branchMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: MATERIAL_ROUGHNESS.branch,
        metalness: 0,
      }),
    [],
  );
  const leafMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: MATERIAL_ROUGHNESS.leaf,
        metalness: 0,
      }),
    [],
  );
  const fenceMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: MATERIAL_ROUGHNESS.fence,
        metalness: 0,
      }),
    [],
  );

  const cubeData = useMemo<CubeInstanceData>(() => {
    let logCount = 0;
    let branchCount = 0;
    let leafCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];
      if (typeIdx === 0) {
        logCount++;
      } else if (typeIdx === 1) {
        branchCount++;
      } else if (typeIdx === 2) {
        leafCount++;
      }
    }

    const logAxes = new Float32Array(Math.max(1, logCount));
    const branchAxes = new Float32Array(Math.max(1, branchCount));
    const leafAxes = new Float32Array(Math.max(1, leafCount));

    logCount = 0;
    branchCount = 0;
    leafCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];
      if (typeIdx === 0) {
        logAxes[logCount] = buffer.axes[i] ?? 0;
        logCount++;
      } else if (typeIdx === 1) {
        branchAxes[branchCount] = buffer.axes[i] ?? 0;
        branchCount++;
      } else if (typeIdx === 2) {
        leafAxes[leafCount] = buffer.axes[i] ?? 0;
        leafCount++;
      }
    }

    return {
      counts: {
        log: logCount,
        branch: branchCount,
        leaf: leafCount,
      },
      axes: {
        log: logAxes,
        branch: branchAxes,
        leaf: leafAxes,
      },
    };
  }, [buffer]);

  const atlasTexture = useMemo(() => loadAtlas(MINECRAFT_ATLAS_DEFINITION.atlasUrl), []);
  useEffect(() => {
    if (atlasTexture) {
      atlasTexture.anisotropy = glCapabilities.getMaxAnisotropy();
      atlasTexture.needsUpdate = true;
    }
  }, [atlasTexture, glCapabilities]);
  const logBlockTextures =
    MINECRAFT_ATLAS_DEFINITION.blockTextures[minecraftPalette.log] ?? DEFAULT_BLOCK_TEXTURES.log;
  const branchBlockTextures =
    MINECRAFT_ATLAS_DEFINITION.blockTextures[minecraftPalette.branch] ?? DEFAULT_BLOCK_TEXTURES.branch;
  const leafBlockTextures =
    MINECRAFT_ATLAS_DEFINITION.blockTextures[minecraftPalette.leaf] ?? DEFAULT_BLOCK_TEXTURES.leaf;
  const leafTintColor = getLeafTintColor(minecraftPalette.leaf);

  const fenceBlockId = minecraftPalette.fence;
  const fenceCellIndex = MINECRAFT_ATLAS_DEFINITION.fenceTextures[fenceBlockId]?.texture
    ?? MINECRAFT_ATLAS_DEFINITION.fenceTextures['oak_fence']?.texture
    ?? 44;

  const texturedFenceMaterial = useMemo(() => {
    if (textureSet !== 'minecraft' || !atlasTexture) {
      return null;
    }
    return createTexturedFenceMaterial(
      atlasTexture,
      MINECRAFT_ATLAS_DEFINITION.atlasGridSize,
      fenceCellIndex,
    );
  }, [atlasTexture, fenceCellIndex, textureSet]);

  const texturedLogMaterial = useMemo(() => {
    if (textureSet !== 'minecraft' || !atlasTexture) {
      return null;
    }

    return createTexturedVoxelMaterial(
      atlasTexture,
      MINECRAFT_ATLAS_DEFINITION.atlasGridSize,
      logBlockTextures,
      {},
    );
  }, [atlasTexture, logBlockTextures, textureSet]);

  const texturedBranchMaterial = useMemo(() => {
    if (textureSet !== 'minecraft' || !atlasTexture) {
      return null;
    }

    return createTexturedVoxelMaterial(
      atlasTexture,
      MINECRAFT_ATLAS_DEFINITION.atlasGridSize,
      branchBlockTextures,
      {},
    );
  }, [atlasTexture, branchBlockTextures, textureSet]);

  const texturedLeafMaterial = useMemo(() => {
    if (textureSet !== 'minecraft' || !atlasTexture) {
      return null;
    }

    return createTexturedVoxelMaterial(
      atlasTexture,
      MINECRAFT_ATLAS_DEFINITION.atlasGridSize,
      leafBlockTextures,
      { alphaToCoverage: true, doubleSided: true, tintColor: leafTintColor },
    );
  }, [atlasTexture, leafBlockTextures, leafTintColor, textureSet]);

  useEffect(() => () => {
    logGeometry.dispose();
    branchGeometry.dispose();
    leafGeometry.dispose();
    fencePostGeometry.dispose();
    fenceNSRailGeometry.dispose();
    fenceEWRailGeometry.dispose();
    logMaterial.dispose();
    branchMaterial.dispose();
    leafMaterial.dispose();
    fenceMaterial.dispose();
  }, [branchGeometry, branchMaterial, fenceEWRailGeometry, fenceMaterial, fenceNSRailGeometry, fencePostGeometry, leafGeometry, leafMaterial, logGeometry, logMaterial]);

  useEffect(() => () => {
    texturedLogMaterial?.dispose();
  }, [texturedLogMaterial]);

  useEffect(() => () => {
    texturedBranchMaterial?.dispose();
  }, [texturedBranchMaterial]);

  useEffect(() => () => {
    texturedLeafMaterial?.dispose();
  }, [texturedLeafMaterial]);

  useEffect(() => () => {
    texturedFenceMaterial?.dispose();
  }, [texturedFenceMaterial]);

  useEffect(() => {
    setAxisAttribute(logGeometry, cubeData.axes.log);
    setAxisAttribute(branchGeometry, cubeData.axes.branch);
    setAxisAttribute(leafGeometry, cubeData.axes.leaf);
    invalidate();
  }, [branchGeometry, cubeData.axes.branch, cubeData.axes.leaf, cubeData.axes.log, invalidate, leafGeometry, logGeometry]);

  const activeLogMaterial = isMinecraftTextureMode && texturedLogMaterial ? texturedLogMaterial : logMaterial;
  const activeBranchMaterial = isMinecraftTextureMode && texturedBranchMaterial ? texturedBranchMaterial : branchMaterial;
  const activeLeafMaterial = isMinecraftTextureMode && texturedLeafMaterial ? texturedLeafMaterial : leafMaterial;
  const activeFenceMaterial = isMinecraftTextureMode && texturedFenceMaterial ? texturedFenceMaterial : fenceMaterial;
  const maxLogInstances = Math.max(1, cubeData.counts.log);
  const maxBranchInstances = Math.max(1, cubeData.counts.branch);
  const maxLeafInstances = Math.max(1, cubeData.counts.leaf);
  const maxFenceInstances = Math.max(1, buffer.fencePostCount);
  const maxFenceNSRailInstances = Math.max(1, buffer.fenceNSRailCount);
  const maxFenceEWRailInstances = Math.max(1, buffer.fenceEWRailCount);

  useEffect(() => {
    const logMesh = meshRefs.current.log;
    const branchMesh = meshRefs.current.branch;
    const leafMesh = meshRefs.current.leaf;
    const fencePostMesh = meshRefs.current.fencePost;
    const fenceNSRailMesh = meshRefs.current.fenceNSRail;
    const fenceEWRailMesh = meshRefs.current.fenceEWRail;
    if (!logMesh || !branchMesh || !leafMesh || !fencePostMesh || !fenceNSRailMesh || !fenceEWRailMesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    const neutralColor = new THREE.Color(0xffffff);
    let logCount = 0;
    let branchCount = 0;
    let leafCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];
      matrix.fromArray(buffer.matrices, i * 16);
      color.fromArray(buffer.colors, i * 3);

      if (typeIdx === 0) {
        logMesh.setMatrixAt(logCount, matrix);
        logMesh.setColorAt(logCount, isMinecraftTextureMode ? neutralColor : color);
        logCount++;
      } else if (typeIdx === 1) {
        branchMesh.setMatrixAt(branchCount, matrix);
        branchMesh.setColorAt(branchCount, isMinecraftTextureMode ? neutralColor : color);
        branchCount++;
      } else if (typeIdx === 2) {
        leafMesh.setMatrixAt(leafCount, matrix);
        leafMesh.setColorAt(leafCount, isMinecraftTextureMode ? neutralColor : color);
        leafCount++;
      }
    }

    for (let i = 0; i < buffer.fencePostCount; i++) {
      matrix.fromArray(buffer.fencePostMatrices, i * 16);
      color.fromArray(buffer.fencePostColors, i * 3);
      fencePostMesh.setMatrixAt(i, matrix);
      fencePostMesh.setColorAt(i, isMinecraftTextureMode ? neutralColor : color);
    }

    for (let i = 0; i < buffer.fenceNSRailCount; i++) {
      matrix.fromArray(buffer.fenceNSRailMatrices, i * 16);
      color.fromArray(buffer.fenceNSRailColors, i * 3);
      fenceNSRailMesh.setMatrixAt(i, matrix);
      fenceNSRailMesh.setColorAt(i, isMinecraftTextureMode ? neutralColor : color);
    }

    for (let i = 0; i < buffer.fenceEWRailCount; i++) {
      matrix.fromArray(buffer.fenceEWRailMatrices, i * 16);
      color.fromArray(buffer.fenceEWRailColors, i * 3);
      fenceEWRailMesh.setMatrixAt(i, matrix);
      fenceEWRailMesh.setColorAt(i, isMinecraftTextureMode ? neutralColor : color);
    }

    logMesh.count = logCount;
    branchMesh.count = branchCount;
    leafMesh.count = leafCount;
    fencePostMesh.count = buffer.fencePostCount;
    fenceNSRailMesh.count = buffer.fenceNSRailCount;
    fenceEWRailMesh.count = buffer.fenceEWRailCount;

    logMesh.instanceMatrix.needsUpdate = true;
    branchMesh.instanceMatrix.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
    fencePostMesh.instanceMatrix.needsUpdate = true;
    fenceNSRailMesh.instanceMatrix.needsUpdate = true;
    fenceEWRailMesh.instanceMatrix.needsUpdate = true;
    if (logMesh.instanceColor) logMesh.instanceColor.needsUpdate = true;
    if (branchMesh.instanceColor) branchMesh.instanceColor.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    if (fencePostMesh.instanceColor) fencePostMesh.instanceColor.needsUpdate = true;
    if (fenceNSRailMesh.instanceColor) fenceNSRailMesh.instanceColor.needsUpdate = true;
    if (fenceEWRailMesh.instanceColor) fenceEWRailMesh.instanceColor.needsUpdate = true;

    invalidate();
  }, [activeBranchMaterial, activeFenceMaterial, activeLeafMaterial, activeLogMaterial, buffer, invalidate, isMinecraftTextureMode]);

  useEffect(() => {
    const logMesh = meshRefs.current.log;
    const branchMesh = meshRefs.current.branch;
    const leafMesh = meshRefs.current.leaf;
    const fencePostMesh = meshRefs.current.fencePost;
    const fenceNSRailMesh = meshRefs.current.fenceNSRail;
    const fenceEWRailMesh = meshRefs.current.fenceEWRail;
    if (!logMesh || !branchMesh || !leafMesh || !fencePostMesh || !fenceNSRailMesh || !fenceEWRailMesh) return;

    logMesh.visible = showLog;
    branchMesh.visible = showBranch;
    leafMesh.visible = showLeaf;
    fencePostMesh.visible = showBranch;
    fenceNSRailMesh.visible = showBranch;
    fenceEWRailMesh.visible = showBranch;
    invalidate();
  }, [showBranch, showLeaf, showLog, invalidate]);

  useEffect(() => {
    invalidate();
  }, [invalidate, textureSet, texturedBranchMaterial, texturedFenceMaterial, texturedLeafMaterial, texturedLogMaterial]);

  return (
    <>
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.log = mesh;
        }}
        args={[logGeometry, activeLogMaterial, maxLogInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.branch = mesh;
        }}
        args={[branchGeometry, activeBranchMaterial, maxBranchInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.leaf = mesh;
        }}
        args={[leafGeometry, activeLeafMaterial, maxLeafInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.fencePost = mesh;
        }}
        args={[fencePostGeometry, activeFenceMaterial, maxFenceInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.fenceNSRail = mesh;
        }}
        args={[fenceNSRailGeometry, activeFenceMaterial, maxFenceNSRailInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.fenceEWRail = mesh;
        }}
        args={[fenceEWRailGeometry, activeFenceMaterial, maxFenceEWRailInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
    </>
  );
}

function setAxisAttribute(geometry: THREE.BoxGeometry, axes: Float32Array): void {
  const attribute = new THREE.InstancedBufferAttribute(axes, 1);
  geometry.setAttribute('instanceAxis', attribute);
  attribute.needsUpdate = true;
}
