import type { MinecraftBlockId } from './types';

export type McBlockPreset = {
  id: MinecraftBlockId;
  label: string;
  approximateHex: string;
  category: 'log' | 'branch' | 'leaf' | 'fence';
};

export const MC_BLOCK_PRESETS: McBlockPreset[] = [
  { id: 'oak_log', label: 'Oak Log', approximateHex: '#6b5229', category: 'log' },
  { id: 'spruce_log', label: 'Spruce Log', approximateHex: '#3b2712', category: 'log' },
  { id: 'birch_log', label: 'Birch Log', approximateHex: '#d5cdb4', category: 'log' },
  { id: 'jungle_log', label: 'Jungle Log', approximateHex: '#564419', category: 'log' },
  { id: 'acacia_log', label: 'Acacia Log', approximateHex: '#676157', category: 'log' },
  { id: 'dark_oak_log', label: 'Dark Oak Log', approximateHex: '#3e2912', category: 'log' },
  { id: 'mangrove_log', label: 'Mangrove Log', approximateHex: '#6b4535', category: 'log' },
  { id: 'cherry_log', label: 'Cherry Log', approximateHex: '#3b1e1a', category: 'log' },
  { id: 'bamboo_block', label: 'Bamboo Block', approximateHex: '#8c9f2a', category: 'log' },
  { id: 'stripped_oak_log', label: 'Stripped Oak Log', approximateHex: '#b29157', category: 'log' },
  { id: 'stripped_spruce_log', label: 'Stripped Spruce Log', approximateHex: '#725a36', category: 'log' },
  { id: 'stripped_birch_log', label: 'Stripped Birch Log', approximateHex: '#c8b77d', category: 'log' },
  { id: 'stripped_jungle_log', label: 'Stripped Jungle Log', approximateHex: '#ac8850', category: 'log' },
  { id: 'stripped_acacia_log', label: 'Stripped Acacia Log', approximateHex: '#b05d3b', category: 'log' },
  { id: 'stripped_dark_oak_log', label: 'Stripped Dark Oak Log', approximateHex: '#5a4428', category: 'log' },
  { id: 'stripped_mangrove_log', label: 'Stripped Mangrove Log', approximateHex: '#7b3a36', category: 'log' },
  { id: 'stripped_cherry_log', label: 'Stripped Cherry Log', approximateHex: '#d9a1a1', category: 'log' },
  { id: 'oak_planks', label: 'Oak Planks', approximateHex: '#c8a96b', category: 'log' },
  { id: 'spruce_planks', label: 'Spruce Planks', approximateHex: '#7a5c2a', category: 'log' },
  { id: 'birch_planks', label: 'Birch Planks', approximateHex: '#d4c98a', category: 'log' },
  { id: 'jungle_planks', label: 'Jungle Planks', approximateHex: '#b08040', category: 'log' },
  { id: 'acacia_planks', label: 'Acacia Planks', approximateHex: '#c06030', category: 'log' },
  { id: 'dark_oak_planks', label: 'Dark Oak Planks', approximateHex: '#4a3018', category: 'log' },
  { id: 'mangrove_planks', label: 'Mangrove Planks', approximateHex: '#7a3a30', category: 'log' },
  { id: 'cherry_planks', label: 'Cherry Planks', approximateHex: '#e8b0a8', category: 'log' },
  { id: 'bamboo_planks', label: 'Bamboo Planks', approximateHex: '#c8b830', category: 'log' },

  { id: 'oak_log', label: 'Oak Log', approximateHex: '#6b5229', category: 'branch' },
  { id: 'spruce_log', label: 'Spruce Log', approximateHex: '#3b2712', category: 'branch' },
  { id: 'birch_log', label: 'Birch Log', approximateHex: '#d5cdb4', category: 'branch' },
  { id: 'jungle_log', label: 'Jungle Log', approximateHex: '#564419', category: 'branch' },
  { id: 'acacia_log', label: 'Acacia Log', approximateHex: '#676157', category: 'branch' },
  { id: 'dark_oak_log', label: 'Dark Oak Log', approximateHex: '#3e2912', category: 'branch' },
  { id: 'mangrove_log', label: 'Mangrove Log', approximateHex: '#6b4535', category: 'branch' },
  { id: 'cherry_log', label: 'Cherry Log', approximateHex: '#3b1e1a', category: 'branch' },
  { id: 'bamboo_block', label: 'Bamboo Block', approximateHex: '#8c9f2a', category: 'branch' },
  { id: 'stripped_oak_log', label: 'Stripped Oak Log', approximateHex: '#b29157', category: 'branch' },
  { id: 'stripped_spruce_log', label: 'Stripped Spruce Log', approximateHex: '#725a36', category: 'branch' },
  { id: 'stripped_birch_log', label: 'Stripped Birch Log', approximateHex: '#c8b77d', category: 'branch' },
  { id: 'stripped_jungle_log', label: 'Stripped Jungle Log', approximateHex: '#ac8850', category: 'branch' },
  { id: 'stripped_acacia_log', label: 'Stripped Acacia Log', approximateHex: '#b05d3b', category: 'branch' },
  { id: 'stripped_dark_oak_log', label: 'Stripped Dark Oak Log', approximateHex: '#5a4428', category: 'branch' },
  { id: 'stripped_mangrove_log', label: 'Stripped Mangrove Log', approximateHex: '#7b3a36', category: 'branch' },
  { id: 'stripped_cherry_log', label: 'Stripped Cherry Log', approximateHex: '#d9a1a1', category: 'branch' },
  { id: 'oak_planks', label: 'Oak Planks', approximateHex: '#c8a96b', category: 'branch' },
  { id: 'spruce_planks', label: 'Spruce Planks', approximateHex: '#7a5c2a', category: 'branch' },
  { id: 'birch_planks', label: 'Birch Planks', approximateHex: '#d4c98a', category: 'branch' },
  { id: 'jungle_planks', label: 'Jungle Planks', approximateHex: '#b08040', category: 'branch' },
  { id: 'acacia_planks', label: 'Acacia Planks', approximateHex: '#c06030', category: 'branch' },
  { id: 'dark_oak_planks', label: 'Dark Oak Planks', approximateHex: '#4a3018', category: 'branch' },
  { id: 'mangrove_planks', label: 'Mangrove Planks', approximateHex: '#7a3a30', category: 'branch' },
  { id: 'cherry_planks', label: 'Cherry Planks', approximateHex: '#e8b0a8', category: 'branch' },
  { id: 'bamboo_planks', label: 'Bamboo Planks', approximateHex: '#c8b830', category: 'branch' },

  { id: 'oak_leaves', label: 'Oak Leaves', approximateHex: '#4a7a32', category: 'leaf' },
  { id: 'spruce_leaves', label: 'Spruce Leaves', approximateHex: '#3b5e30', category: 'leaf' },
  { id: 'birch_leaves', label: 'Birch Leaves', approximateHex: '#5a8c3c', category: 'leaf' },
  { id: 'jungle_leaves', label: 'Jungle Leaves', approximateHex: '#30801a', category: 'leaf' },
  { id: 'acacia_leaves', label: 'Acacia Leaves', approximateHex: '#4a7a32', category: 'leaf' },
  { id: 'dark_oak_leaves', label: 'Dark Oak Leaves', approximateHex: '#4a7a32', category: 'leaf' },
  { id: 'mangrove_leaves', label: 'Mangrove Leaves', approximateHex: '#4d8b28', category: 'leaf' },
  { id: 'cherry_leaves', label: 'Cherry Leaves', approximateHex: '#e8b4c8', category: 'leaf' },
  { id: 'azalea_leaves', label: 'Azalea Leaves', approximateHex: '#5a8c3c', category: 'leaf' },
  { id: 'flowering_azalea_leaves', label: 'Flowering Azalea Leaves', approximateHex: '#7b9847', category: 'leaf' },

  { id: 'oak_fence', label: 'Oak Fence', approximateHex: '#b29157', category: 'fence' },
  { id: 'spruce_fence', label: 'Spruce Fence', approximateHex: '#725a36', category: 'fence' },
  { id: 'birch_fence', label: 'Birch Fence', approximateHex: '#c8b77d', category: 'fence' },
  { id: 'jungle_fence', label: 'Jungle Fence', approximateHex: '#ac8850', category: 'fence' },
  { id: 'acacia_fence', label: 'Acacia Fence', approximateHex: '#b05d3b', category: 'fence' },
  { id: 'dark_oak_fence', label: 'Dark Oak Fence', approximateHex: '#5a4428', category: 'fence' },
  { id: 'mangrove_fence', label: 'Mangrove Fence', approximateHex: '#7b3a36', category: 'fence' },
  { id: 'cherry_fence', label: 'Cherry Fence', approximateHex: '#d9a1a1', category: 'fence' },
  { id: 'bamboo_fence', label: 'Bamboo Fence', approximateHex: '#8c9f2a', category: 'fence' },
];

export function getPresetsForCategory(category: McBlockPreset['category']): McBlockPreset[] {
  return MC_BLOCK_PRESETS.filter((preset) => preset.category === category);
}

export function getPresetById(id: string): McBlockPreset | undefined {
  return MC_BLOCK_PRESETS.find((preset) => preset.id === id);
}
