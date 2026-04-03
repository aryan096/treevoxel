import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Sky } from '@react-three/drei';
import * as THREE from 'three';
import VoxelMesh from './VoxelMesh';
import LayerHighlight from './LayerHighlight';
import DioramaGround from './DioramaGround';
import { useTreeStore } from '../store/treeStore';
import type { RenderStyleId } from './renderStyle';

type VoxelSceneProps = {
  showSliceHighlight?: boolean;
};

type LightingPreset = {
  background?: string;
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  ambientIntensity: number;
  keyPosition: [number, number, number];
  keyIntensity: number;
  keyColor: string;
  keyShadowBias: number;
  keyShadowNormalBias: number;
  rimIntensity: number;
  toneMappingExposure: number;
  shadows: boolean;
};

const LIGHTING_PRESETS: Record<RenderStyleId, LightingPreset> = {
  flat: {
    hemisphereSky: '#fff2d6',
    hemisphereGround: '#7f9176',
    hemisphereIntensity: 1.05,
    ambientIntensity: 0.28,
    keyPosition: [24, 36, 18],
    keyIntensity: 0.78,
    keyColor: '#fff2d6',
    keyShadowBias: -0.00015,
    keyShadowNormalBias: 0.02,
    rimIntensity: 0.2,
    toneMappingExposure: 1.08,
    shadows: true,
  },
  diorama: {
    background: '#c5b293',
    hemisphereSky: '#b9d3ef',
    hemisphereGround: '#6d775d',
    hemisphereIntensity: 0.84,
    ambientIntensity: 0.14,
    keyPosition: [18, 34, 24],
    keyIntensity: 1.12,
    keyColor: '#ffd39a',
    keyShadowBias: -0.00022,
    keyShadowNormalBias: 0.03,
    rimIntensity: 0.38,
    toneMappingExposure: 1.02,
    shadows: true,
  },
};

export default function VoxelScene({ showSliceHighlight = true }: VoxelSceneProps) {
  const showGrid = useTreeStore((s) => s.display.showGrid);
  const showAxes = useTreeStore((s) => s.display.showAxes);
  const height = useTreeStore((s) => s.params.height);
  const renderStyle = useTreeStore((s) => s.renderStyle);
  const textureSet = useTreeStore((s) => s.textureSet);
  const scenePalette = {
    background: '#d9cfbe',
    gridCell: '#a8967f',
    gridSection: '#826e55',
    axisColors: ['#a85f42', '#6f8150', '#9f7d4c'] as [string, string, string],
    axisLabel: '#2f2418',
    rimLight: '#b28d69',
  };
  const dioramaPalette = {
    background: '#0f1216',
    gridCell: '#37414a',
    gridSection: '#566372',
    axisColors: ['#bf7a53', '#86a76d', '#79a7c6'] as [string, string, string],
    axisLabel: '#dde5ec',
    rimLight: '#8ec2ff',
  };
  const activePalette = renderStyle === 'diorama' ? dioramaPalette : scenePalette;
  const lightingPreset = LIGHTING_PRESETS[renderStyle];
  const isMinecraft = textureSet === 'minecraft';
  const isDiorama = renderStyle === 'diorama';
  const dioramaFogColor = isMinecraft ? '#a8d0ff' : '#c2d8f0';
  const dioramaBackground = isMinecraft ? '#a8d0ff' : '#87ceeb';
  const background = isDiorama
    ? dioramaBackground
    : (lightingPreset.background ?? activePalette.background);

  return (
    <Canvas
      key={renderStyle}
      frameloop="demand"
      camera={{ position: [30, 20, 30], fov: 50, near: 0.1, far: 500 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = lightingPreset.toneMappingExposure;
      }}
      shadows
    >
      <color attach="background" args={[background]} />
      {isDiorama && <fogExp2 attach="fog" args={[dioramaFogColor, 0.0015]} />}
      <hemisphereLight
        args={[
          lightingPreset.hemisphereSky,
          lightingPreset.hemisphereGround,
          lightingPreset.hemisphereIntensity,
        ]}
      />
      <ambientLight intensity={lightingPreset.ambientIntensity} />
      <directionalLight
        position={lightingPreset.keyPosition}
        intensity={lightingPreset.keyIntensity}
        color={lightingPreset.keyColor}
        castShadow={lightingPreset.shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={lightingPreset.keyShadowBias}
        shadow-normalBias={lightingPreset.keyShadowNormalBias}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
      />
      <directionalLight
        position={[-18, 14, -12]}
        intensity={lightingPreset.rimIntensity}
        color={activePalette.rimLight}
      />

      {isDiorama && isMinecraft && (
        <mesh>
          <sphereGeometry args={[450, 64, 32]} />
          <meshBasicMaterial color="#a8d0ff" side={THREE.BackSide} depthWrite={false} fog={false} />
        </mesh>
      )}
      {isDiorama && !isMinecraft && (
        <Sky
          distance={450}
          sunPosition={[1, 1, 0.5]}
          rayleigh={0.8}
          turbidity={3}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      )}

      <VoxelMesh />
      {isDiorama ? <DioramaGround /> : null}
      {showSliceHighlight ? <LayerHighlight /> : null}

      {showGrid && (
        <Grid
          args={[60, 60]}
          position={[0, 0, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor={activePalette.gridCell}
          sectionSize={5}
          sectionThickness={1}
          sectionColor={activePalette.gridSection}
          fadeDistance={80}
          fadeStrength={1}
          infiniteGrid
        />
      )}

      {showAxes && (
        <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
          <GizmoViewport
            axisColors={activePalette.axisColors}
            labelColor={activePalette.axisLabel}
            axisHeadScale={0.8}
          />
        </GizmoHelper>
      )}

      <OrbitControls
        target={[0, height / 1.75, 0]}
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={200}
      />
    </Canvas>
  );
}
