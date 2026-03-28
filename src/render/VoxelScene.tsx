import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import VoxelMesh from './VoxelMesh';
import LayerHighlight from './LayerHighlight';
import { useTreeStore } from '../store/treeStore';

export default function VoxelScene() {
  const display = useTreeStore((s) => s.display);
  const height = useTreeStore((s) => s.params.height);

  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [30, 20, 30], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 40, 20]} intensity={0.8} />
      <directionalLight position={[-10, 20, -10]} intensity={0.3} />

      <VoxelMesh />
      <LayerHighlight />

      {display.showGrid && (
        <Grid
          args={[60, 60]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#2a2a4a"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#3a3a5a"
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
