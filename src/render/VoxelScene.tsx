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
  const scenePalette = display.darkMode
    ? {
        background: '#17120d',
        gridCell: '#4f4334',
        gridSection: '#7c694f',
        axisColors: ['#9b5a3c', '#74845a', '#b08b57'] as [string, string, string],
        axisLabel: '#eadfcf',
        rimLight: '#c2ad93',
      }
    : {
        background: '#d9cfbe',
        gridCell: '#a8967f',
        gridSection: '#826e55',
        axisColors: ['#a85f42', '#6f8150', '#9f7d4c'] as [string, string, string],
        axisLabel: '#2f2418',
        rimLight: '#b28d69',
      };

  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [30, 20, 30], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
      shadows
    >
      <color attach="background" args={[scenePalette.background]} />
      <hemisphereLight args={['#fff5dd', '#7d8f73', 0.8]} />
      <ambientLight intensity={0.14} />
      <directionalLight
        position={[24, 36, 18]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-18, 14, -12]} intensity={0.22} color={scenePalette.rimLight} />

      <VoxelMesh />
      {showSliceHighlight ? <LayerHighlight /> : null}

      {display.showGrid && (
        <Grid
          args={[60, 60]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor={scenePalette.gridCell}
          sectionSize={5}
          sectionThickness={1}
          sectionColor={scenePalette.gridSection}
          fadeDistance={80}
          fadeStrength={1}
          infiniteGrid
        />
      )}

      {display.showAxes && (
        <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
          <GizmoViewport
            axisColors={scenePalette.axisColors}
            labelColor={scenePalette.axisLabel}
            axisHeadScale={0.8}
          />
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
