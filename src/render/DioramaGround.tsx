import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useTreeStore } from '../store/treeStore';
import { DEFAULT_DIORAMA_GRASS_TINT, getMinecraftGrassTintColor } from './minecraftTints';

const DIORAMA_MARGIN = 5;
const DIORAMA_Y = 0;

export default function DioramaGround() {
  const textureSet = useTreeStore((s) => s.textureSet);

  if (textureSet === 'minecraft') {
    return <MinecraftDioramaGround />;
  }

  return <FlatDioramaGround />;
}

function FlatDioramaGround() {
  const bounds = useTreeStore((s) => s.voxels.bounds);
  const invalidate = useThree((s) => s.invalidate);
  const size = useMemo(() => getGroundSize(bounds), [bounds]);
  const color = DEFAULT_DIORAMA_GRASS_TINT;

  useEffect(() => {
    invalidate();
  }, [invalidate, size.depth, size.width]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size.centerX, DIORAMA_Y, size.centerZ]} receiveShadow>
      <planeGeometry args={[size.width, size.depth]} />
      <meshStandardMaterial color={color} roughness={1} metalness={0} />
    </mesh>
  );
}

function MinecraftDioramaGround() {
  const bounds = useTreeStore((s) => s.voxels.bounds);
  const invalidate = useThree((s) => s.invalidate);
  const size = useMemo(() => getGroundSize(bounds), [bounds]);
  const grassTexture = useTexture('/textures/minecraft/grass_block_top.png');
  const grassTint = useMemo(() => getMinecraftGrassTintColor(), []);

  useEffect(() => {
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(size.width, size.depth);
    grassTexture.minFilter = THREE.NearestFilter;
    grassTexture.magFilter = THREE.NearestFilter;
    grassTexture.colorSpace = THREE.SRGBColorSpace;
    grassTexture.needsUpdate = true;
  }, [grassTexture, size.depth, size.width]);

  useEffect(() => {
    invalidate();
  }, [grassTexture, invalidate, size.depth, size.width]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size.centerX, DIORAMA_Y, size.centerZ]} receiveShadow>
      <planeGeometry args={[size.width, size.depth]} />
      <meshLambertMaterial map={grassTexture} color={grassTint} />
    </mesh>
  );
}

function getGroundSize(bounds: {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}) {
  const width = Math.max(12, bounds.maxX - bounds.minX + 1 + DIORAMA_MARGIN * 2);
  const depth = Math.max(12, bounds.maxZ - bounds.minZ + 1 + DIORAMA_MARGIN * 2);

  return {
    width,
    depth,
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerZ: (bounds.minZ + bounds.maxZ) / 2,
  };
}
