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

  const hasVoxels = voxels.layers.size > 0;
  const width = hasVoxels ? voxels.bounds.maxX - voxels.bounds.minX + 2 : 1;
  const depth = hasVoxels ? voxels.bounds.maxZ - voxels.bounds.minZ + 2 : 1;
  const centerX = hasVoxels ? (voxels.bounds.minX + voxels.bounds.maxX) / 2 : 0;
  const centerZ = hasVoxels ? (voxels.bounds.minZ + voxels.bounds.maxZ) / 2 : 0;
  const sliceColor = darkMode ? '#b78a52' : '#8f6538';
  const slabGeometry = useMemo(() => new THREE.BoxGeometry(width, 0.98, depth), [depth, width]);
  const slabEdges = useMemo(() => new THREE.EdgesGeometry(slabGeometry), [slabGeometry]);

  if (!hasVoxels) return null;

  return (
    <group position={[centerX, activeLayer + 0.5, centerZ]}>
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
