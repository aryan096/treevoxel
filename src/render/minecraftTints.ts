import * as THREE from 'three';
import type { MinecraftBlockId } from '../core/types';

type MinecraftTint = {
  grass: string;
  foliage: string;
};

export const MINECRAFT_BIOME_TINTS = {
  plains: { grass: '#91BD59', foliage: '#77AB2F' },
  forest: { grass: '#79C05A', foliage: '#59AE30' },
  darkForest: { grass: '#507A32', foliage: '#59AE30' },
  swamp: { grass: '#6A7039', foliage: '#6A7039' },
  mangroveSwamp: { grass: '#4C763C', foliage: '#8DB127' },
  jungle: { grass: '#59C93C', foliage: '#30BB0B' },
  birchForest: { grass: '#88BB67', foliage: '#6BA941' },
  taiga: { grass: '#86B783', foliage: '#68A464' },
  savanna: { grass: '#BFB755', foliage: '#AEA42A' },
  badlands: { grass: '#90814D', foliage: '#9E814D' },
  snowy: { grass: '#80B497', foliage: '#60A17B' },
  ocean: { grass: '#8EB971', foliage: '#71A74D' },
  mushroomFields: { grass: '#55C93F', foliage: '#2BBB0F' },
  cherryGrove: { grass: '#B6DB61', foliage: '#B6DB61' },
  paleGarden: { grass: '#778272', foliage: '#878D76' },
} as const satisfies Record<string, MinecraftTint>;

export const MINECRAFT_BLOCK_TINTS = {
  birch_leaves: '#80A755',
  spruce_leaves: '#619961',
  lily_pad: '#208030',
  attached_stem: '#E0C71C',
} as const;

const LEAF_TINT_BY_BLOCK_ID: Partial<Record<MinecraftBlockId, string>> = {
  oak_leaves: MINECRAFT_BIOME_TINTS.plains.foliage,
  spruce_leaves: MINECRAFT_BLOCK_TINTS.spruce_leaves,
  birch_leaves: MINECRAFT_BLOCK_TINTS.birch_leaves,
  jungle_leaves: MINECRAFT_BIOME_TINTS.jungle.foliage,
  acacia_leaves: MINECRAFT_BIOME_TINTS.savanna.foliage,
  dark_oak_leaves: MINECRAFT_BIOME_TINTS.darkForest.foliage,
  mangrove_leaves: MINECRAFT_BIOME_TINTS.mangroveSwamp.foliage,
  azalea_leaves: MINECRAFT_BIOME_TINTS.forest.foliage,
};

export const DEFAULT_DIORAMA_GRASS_TINT = MINECRAFT_BIOME_TINTS.plains.grass;

export function getMinecraftLeafTintHex(blockId: MinecraftBlockId): string | undefined {
  return LEAF_TINT_BY_BLOCK_ID[blockId];
}

export function getMinecraftLeafTintColor(blockId: MinecraftBlockId): THREE.Color | undefined {
  const hex = getMinecraftLeafTintHex(blockId);
  return hex ? new THREE.Color(hex) : undefined;
}

export function getMinecraftGrassTintColor(): THREE.Color {
  return new THREE.Color(DEFAULT_DIORAMA_GRASS_TINT);
}
