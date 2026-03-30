import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTreeStore } from '../store/treeStore';

type MeshRefs = {
  log: THREE.InstancedMesh | null;
  branch: THREE.InstancedMesh | null;
  leaf: THREE.InstancedMesh | null;
  fencePost: THREE.InstancedMesh | null;
  fenceArm: THREE.InstancedMesh | null;
};

export default function VoxelMesh() {
  const meshRefs = useRef<MeshRefs>({
    log: null,
    branch: null,
    leaf: null,
    fencePost: null,
    fenceArm: null,
  });
  const buffer = useTreeStore((s) => s.buffer);
  const showLog = useTreeStore((s) => s.display.showLog);
  const showBranch = useTreeStore((s) => s.display.showBranch);
  const showLeaf = useTreeStore((s) => s.display.showLeaf);
  const invalidate = useThree((s) => s.invalidate);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.97, 0.97, 0.97), []);
  const fencePostGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const fenceArmGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const logMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.95,
        metalness: 0,
      }),
    [],
  );
  const branchMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0,
      }),
    [],
  );
  const leafMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.85,
        metalness: 0,
      }),
    [],
  );
  const fenceMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0,
      }),
    [],
  );
  const cubeCounts = useMemo(() => {
    let log = 0;
    let branch = 0;
    let leaf = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];
      if (typeIdx === 0) {
        log++;
      } else if (typeIdx === 1) {
        branch++;
      } else if (typeIdx === 2) {
        leaf++;
      }
    }

    return { log, branch, leaf };
  }, [buffer]);

  useEffect(() => {
    const logMesh = meshRefs.current.log;
    const branchMesh = meshRefs.current.branch;
    const leafMesh = meshRefs.current.leaf;
    const fencePostMesh = meshRefs.current.fencePost;
    const fenceArmMesh = meshRefs.current.fenceArm;
    if (!logMesh || !branchMesh || !leafMesh || !fencePostMesh || !fenceArmMesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let logCount = 0;
    let branchCount = 0;
    let leafCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];
      matrix.fromArray(buffer.matrices, i * 16);
      color.fromArray(buffer.colors, i * 3);

      if (typeIdx === 0) {
        logMesh.setMatrixAt(logCount, matrix);
        logMesh.setColorAt(logCount, color);
        logCount++;
      } else if (typeIdx === 1) {
        branchMesh.setMatrixAt(branchCount, matrix);
        branchMesh.setColorAt(branchCount, color);
        branchCount++;
      } else if (typeIdx === 2) {
        leafMesh.setMatrixAt(leafCount, matrix);
        leafMesh.setColorAt(leafCount, color);
        leafCount++;
      }
    }

    for (let i = 0; i < buffer.fencePostCount; i++) {
      matrix.fromArray(buffer.fencePostMatrices, i * 16);
      color.fromArray(buffer.fencePostColors, i * 3);
      fencePostMesh.setMatrixAt(i, matrix);
      fencePostMesh.setColorAt(i, color);
    }

    for (let i = 0; i < buffer.fenceArmCount; i++) {
      matrix.fromArray(buffer.fenceArmMatrices, i * 16);
      color.fromArray(buffer.fenceArmColors, i * 3);
      fenceArmMesh.setMatrixAt(i, matrix);
      fenceArmMesh.setColorAt(i, color);
    }

    logMesh.count = logCount;
    branchMesh.count = branchCount;
    leafMesh.count = leafCount;
    fencePostMesh.count = buffer.fencePostCount;
    fenceArmMesh.count = buffer.fenceArmCount;

    logMesh.instanceMatrix.needsUpdate = true;
    branchMesh.instanceMatrix.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
    fencePostMesh.instanceMatrix.needsUpdate = true;
    fenceArmMesh.instanceMatrix.needsUpdate = true;
    if (logMesh.instanceColor) logMesh.instanceColor.needsUpdate = true;
    if (branchMesh.instanceColor) branchMesh.instanceColor.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    if (fencePostMesh.instanceColor) fencePostMesh.instanceColor.needsUpdate = true;
    if (fenceArmMesh.instanceColor) fenceArmMesh.instanceColor.needsUpdate = true;

    invalidate();
  }, [buffer, invalidate]);

  useEffect(() => {
    const logMesh = meshRefs.current.log;
    const branchMesh = meshRefs.current.branch;
    const leafMesh = meshRefs.current.leaf;
    const fencePostMesh = meshRefs.current.fencePost;
    const fenceArmMesh = meshRefs.current.fenceArm;
    if (!logMesh || !branchMesh || !leafMesh || !fencePostMesh || !fenceArmMesh) return;

    logMesh.visible = showLog;
    branchMesh.visible = showBranch;
    leafMesh.visible = showLeaf;
    fencePostMesh.visible = showBranch;
    fenceArmMesh.visible = showBranch;
    invalidate();
  }, [showBranch, showLeaf, showLog, invalidate]);

  const maxLogInstances = Math.max(1, cubeCounts.log);
  const maxBranchInstances = Math.max(1, cubeCounts.branch);
  const maxLeafInstances = Math.max(1, cubeCounts.leaf);
  const maxFenceInstances = Math.max(1, buffer.fencePostCount);
  const maxFenceArmInstances = Math.max(1, buffer.fenceArmCount);

  return (
    <>
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.log = mesh;
        }}
        args={[geometry, logMaterial, maxLogInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.branch = mesh;
        }}
        args={[geometry, branchMaterial, maxBranchInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.leaf = mesh;
        }}
        args={[geometry, leafMaterial, maxLeafInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.fencePost = mesh;
        }}
        args={[fencePostGeometry, fenceMaterial, maxFenceInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.fenceArm = mesh;
        }}
        args={[fenceArmGeometry, fenceMaterial, maxFenceArmInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
    </>
  );
}
