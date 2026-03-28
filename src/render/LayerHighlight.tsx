import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTreeStore } from '../store/treeStore';

export default function LayerHighlight() {
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const voxels = useTreeStore((s) => s.voxels);
  const darkMode = useTreeStore((s) => s.display.darkMode);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate();
  }, [activeLayer, invalidate, darkMode]);

  if (voxels.layers.size === 0) return null;

  const width = voxels.bounds.maxX - voxels.bounds.minX + 2;
  const depth = voxels.bounds.maxZ - voxels.bounds.minZ + 2;
  const centerX = (voxels.bounds.minX + voxels.bounds.maxX) / 2;
  const centerZ = (voxels.bounds.minZ + voxels.bounds.maxZ) / 2;
  const sliceColor = darkMode ? '#66d9ff' : '#005fcc';
  const slabGeometry = useMemo(() => new THREE.BoxGeometry(width, 0.98, depth), [depth, width]);
  const slabEdges = useMemo(() => new THREE.EdgesGeometry(slabGeometry), [slabGeometry]);

  return (
    <group position={[centerX, activeLayer, centerZ]}>
      <mesh renderOrder={2}>
        <primitive object={slabGeometry} attach="geometry" />
        <meshBasicMaterial
          color={sliceColor}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
      <lineSegments renderOrder={3}>
        <primitive object={slabEdges} attach="geometry" />
        <lineBasicMaterial color={sliceColor} transparent opacity={0.8} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
