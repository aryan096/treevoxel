import type { BlockFaceTextures, FenceTexture, TextureSetDefinition } from './textureSet';

const GRID_SIZE = 8;

function cell(index: number): number {
  return index;
}

function logTextures(sideCell: number, topCell: number): BlockFaceTextures {
  return {
    side: cell(sideCell),
    top: cell(topCell),
    bottom: cell(topCell),
  };
}

function leafTextures(cellIndex: number): BlockFaceTextures {
  return {
    side: cell(cellIndex),
    top: cell(cellIndex),
    bottom: cell(cellIndex),
  };
}

export const MINECRAFT_ATLAS_SOURCE_FILES: Record<string, number> = {
  oak_log: 0,
  oak_log_top: 1,
  spruce_log: 2,
  spruce_log_top: 3,
  birch_log: 4,
  birch_log_top: 5,
  jungle_log: 6,
  jungle_log_top: 7,
  acacia_log: 8,
  acacia_log_top: 9,
  dark_oak_log: 10,
  dark_oak_log_top: 11,
  mangrove_log: 12,
  mangrove_log_top: 13,
  cherry_log: 14,
  cherry_log_top: 15,
  bamboo_block: 16,
  bamboo_block_top: 17,
  stripped_oak_log: 18,
  stripped_oak_log_top: 19,
  stripped_spruce_log: 20,
  stripped_spruce_log_top: 21,
  stripped_birch_log: 22,
  stripped_birch_log_top: 23,
  stripped_jungle_log: 24,
  stripped_jungle_log_top: 25,
  stripped_acacia_log: 26,
  stripped_acacia_log_top: 27,
  stripped_dark_oak_log: 28,
  stripped_dark_oak_log_top: 29,
  stripped_mangrove_log: 30,
  stripped_mangrove_log_top: 31,
  stripped_cherry_log: 32,
  stripped_cherry_log_top: 33,
  oak_leaves: 34,
  birch_leaves: 35,
  spruce_leaves: 36,
  jungle_leaves: 37,
  acacia_leaves: 38,
  dark_oak_leaves: 39,
  mangrove_leaves: 40,
  cherry_leaves: 41,
  azalea_leaves: 42,
  flowering_azalea_leaves: 43,
  oak_planks: 44,
  spruce_planks: 45,
  birch_planks: 46,
  jungle_planks: 47,
  acacia_planks: 48,
  dark_oak_planks: 49,
  mangrove_planks: 50,
  cherry_planks: 51,
  bamboo_fence: 52,
  bamboo_planks: 53,
};

export const MINECRAFT_ATLAS_RESERVED_CELLS: readonly number[] = [];

export const blockTextures: Record<string, BlockFaceTextures> = {
  oak_log: logTextures(0, 1),
  spruce_log: logTextures(2, 3),
  birch_log: logTextures(4, 5),
  jungle_log: logTextures(6, 7),
  acacia_log: logTextures(8, 9),
  dark_oak_log: logTextures(10, 11),
  mangrove_log: logTextures(12, 13),
  cherry_log: logTextures(14, 15),
  bamboo_block: logTextures(16, 17),
  stripped_oak_log: logTextures(18, 19),
  stripped_spruce_log: logTextures(20, 21),
  stripped_birch_log: logTextures(22, 23),
  stripped_jungle_log: logTextures(24, 25),
  stripped_acacia_log: logTextures(26, 27),
  stripped_dark_oak_log: logTextures(28, 29),
  stripped_mangrove_log: logTextures(30, 31),
  stripped_cherry_log: logTextures(32, 33),
  oak_leaves: leafTextures(34),
  birch_leaves: leafTextures(35),
  spruce_leaves: leafTextures(36),
  jungle_leaves: leafTextures(37),
  acacia_leaves: leafTextures(38),
  dark_oak_leaves: leafTextures(39),
  mangrove_leaves: leafTextures(40),
  cherry_leaves: leafTextures(41),
  azalea_leaves: leafTextures(42),
  flowering_azalea_leaves: leafTextures(43),
  oak_planks: { top: 44, bottom: 44, side: 44 },
  spruce_planks: { top: 45, bottom: 45, side: 45 },
  birch_planks: { top: 46, bottom: 46, side: 46 },
  jungle_planks: { top: 47, bottom: 47, side: 47 },
  acacia_planks: { top: 48, bottom: 48, side: 48 },
  dark_oak_planks: { top: 49, bottom: 49, side: 49 },
  mangrove_planks: { top: 50, bottom: 50, side: 50 },
  cherry_planks: { top: 51, bottom: 51, side: 51 },
  bamboo_planks: { top: 53, bottom: 53, side: 53 },
};

export const fenceTextureMap: Record<string, FenceTexture> = {
  oak_fence: { texture: 44 },
  spruce_fence: { texture: 45 },
  birch_fence: { texture: 46 },
  jungle_fence: { texture: 47 },
  acacia_fence: { texture: 48 },
  dark_oak_fence: { texture: 49 },
  mangrove_fence: { texture: 50 },
  cherry_fence: { texture: 51 },
  bamboo_fence: { texture: 52 },
};

export const MINECRAFT_ATLAS_DEFINITION: TextureSetDefinition = {
  id: 'minecraft',
  label: 'Minecraft',
  atlasUrl: '/textures/minecraft/atlas.png',
  atlasGridSize: GRID_SIZE,
  blockTextures,
  fenceTextures: fenceTextureMap,
};
