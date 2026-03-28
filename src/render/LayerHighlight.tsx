import { useTreeStore } from '../store/treeStore';

export default function LayerHighlight() {
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const voxels = useTreeStore((s) => s.voxels);

  if (voxels.layers.size === 0) return null;

  const width = voxels.bounds.maxX - voxels.bounds.minX + 2;
  const depth = voxels.bounds.maxZ - voxels.bounds.minZ + 2;
  const centerX = (voxels.bounds.minX + voxels.bounds.maxX) / 2;
  const centerZ = (voxels.bounds.minZ + voxels.bounds.maxZ) / 2;

  return (
    <mesh
      position={[centerX, activeLayer + 0.5, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial color={0x4488ff} transparent opacity={0.15} side={2} />
    </mesh>
  );
}
