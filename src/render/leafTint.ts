import type { MinecraftBlockId } from '../core/types';
import { getMinecraftLeafTintColor } from './minecraftTints';

export function getLeafTintColor(blockId: MinecraftBlockId) {
  return getMinecraftLeafTintColor(blockId);
}
