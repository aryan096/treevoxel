import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTreeStore } from '../store/treeStore';

type MeshRefs = {
  log: THREE.InstancedMesh | null;
  branch: THREE.InstancedMesh | null;
  leaf: THREE.InstancedMesh | null;
};

export default function VoxelMesh() {
  const meshRefs = useRef<MeshRefs>({ log: null, branch: null, leaf: null });
  const buffer = useTreeStore((s) => s.buffer);
  const display = useTreeStore((s) => s.display);
  const invalidate = useThree((s) => s.invalidate);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.97, 0.97, 0.97), []);
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

  useEffect(() => {
    const logMesh = meshRefs.current.log;
    const branchMesh = meshRefs.current.branch;
    const leafMesh = meshRefs.current.leaf;
    if (!logMesh || !branchMesh || !leafMesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let logCount = 0;
    let branchCount = 0;
    let leafCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];
      matrix.fromArray(buffer.matrices, i * 16);
      color.fromArray(buffer.colors, i * 3);

      if (typeIdx === 0 && display.showLog) {
        logMesh.setMatrixAt(logCount, matrix);
        logMesh.setColorAt(logCount, color);
        logCount++;
      } else if (typeIdx === 1 && display.showBranch) {
        branchMesh.setMatrixAt(branchCount, matrix);
        branchMesh.setColorAt(branchCount, color);
        branchCount++;
      } else if (typeIdx === 2 && display.showLeaf) {
        leafMesh.setMatrixAt(leafCount, matrix);
        leafMesh.setColorAt(leafCount, color);
        leafCount++;
      }
    }

    logMesh.count = logCount;
    branchMesh.count = branchCount;
    leafMesh.count = leafCount;

    logMesh.instanceMatrix.needsUpdate = true;
    branchMesh.instanceMatrix.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
    if (logMesh.instanceColor) logMesh.instanceColor.needsUpdate = true;
    if (branchMesh.instanceColor) branchMesh.instanceColor.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;

    invalidate();
  }, [buffer, display, invalidate]);

  const maxInstances = Math.max(1, buffer.count);

  return (
    <>
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.log = mesh;
        }}
        args={[geometry, logMaterial, maxInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.branch = mesh;
        }}
        args={[geometry, branchMaterial, maxInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => {
          meshRefs.current.leaf = mesh;
        }}
        args={[geometry, leafMaterial, maxInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
    </>
  );
}
