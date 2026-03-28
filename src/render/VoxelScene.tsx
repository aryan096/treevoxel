import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import VoxelMesh from './VoxelMesh';
import LayerHighlight from './LayerHighlight';
import { useTreeStore } from '../store/treeStore';

type VoxelSceneProps = {
  showSliceHighlight?: boolean;
};

export default function VoxelScene({ showSliceHighlight = true }: VoxelSceneProps) {
  const display = useTreeStore((s) => s.display);
  const height = useTreeStore((s) => s.params.height);
  const backgroundColor = display.darkMode ? '#0b1020' : '#d9e5f2';
  const gridCellColor = display.darkMode ? '#5d6b80' : '#9eb0bf';
  const gridSectionColor = display.darkMode ? '#8491a6' : '#7d8fa0';

  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [30, 20, 30], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
      shadows
    >
      <color attach="background" args={[backgroundColor]} />
      <hemisphereLight args={['#fff5dd', '#7d8f73', 0.8]} />
      <ambientLight intensity={0.14} />
      <directionalLight
        position={[24, 36, 18]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-18, 14, -12]} intensity={0.22} color="#b8c7d9" />

      <VoxelMesh />
      {showSliceHighlight ? <LayerHighlight /> : null}

      {display.showGrid && (
        <Grid
          args={[60, 60]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor={gridCellColor}
          sectionSize={5}
          sectionThickness={1}
          sectionColor={gridSectionColor}
          fadeDistance={80}
          fadeStrength={1}
          infiniteGrid
        />
      )}

      {display.showAxes && (
        <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
          <GizmoViewport labelColor="white" axisHeadScale={0.8} />
        </GizmoHelper>
      )}

      <OrbitControls
        target={[0, height / 2, 0]}
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={200}
      />
    </Canvas>
  );
}
