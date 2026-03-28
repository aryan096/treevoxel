import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTreeStore } from '../store/treeStore';

const BLOCK_COLORS: Record<number, THREE.Color> = {
  0: new THREE.Color(0x6b4226), // log - brown
  1: new THREE.Color(0x8b6914), // branch - dark gold
  2: new THREE.Color(0x228b22), // leaf - green
};

export default function VoxelMesh() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const buffer = useTreeStore((s) => s.buffer);
  const display = useTreeStore((s) => s.display);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.95, 0.95, 0.95), []);
  const material = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true }), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let visibleCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];

      // Skip hidden block types
      if (typeIdx === 0 && !display.showLog) continue;
      if (typeIdx === 1 && !display.showBranch) continue;
      if (typeIdx === 2 && !display.showLeaf) continue;

      matrix.fromArray(buffer.matrices, i * 16);
      mesh.setMatrixAt(visibleCount, matrix);

      color.copy(BLOCK_COLORS[typeIdx]);
      mesh.setColorAt(visibleCount, color);

      visibleCount++;
    }

    mesh.count = visibleCount;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [buffer, display]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(1, buffer.count)]}
      frustumCulled={false}
    />
  );
}
