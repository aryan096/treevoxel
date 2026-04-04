import type { MinecraftBlockId } from '../core/types';

export type TextureSetId = 'flat_color' | 'minecraft';

export type BlockFaceTextures = {
  top: number;
  bottom: number;
  side: number;
};

export type FenceTexture = {
  texture: number;
};

export type TextureSetDefinition = {
  id: TextureSetId;
  label: string;
  atlasUrl: string | null;
  atlasGridSize: number;
  blockTextures: Record<MinecraftBlockId, BlockFaceTextures>;
  fenceTextures: Record<string, FenceTexture>;
};

export const FLAT_COLOR_DEFINITION: TextureSetDefinition = {
  id: 'flat_color',
  label: 'Flat Color',
  atlasUrl: null,
  atlasGridSize: 0,
  blockTextures: {},
  fenceTextures: {},
};
