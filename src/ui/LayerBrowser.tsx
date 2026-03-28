import * as Slider from '@radix-ui/react-slider';
import { useMemo } from 'react';
import { useTreeStore } from '../store/treeStore';
import { unpack } from '../core/pack';
import type { BlockType } from '../core/types';
import styles from './LayerBrowser.module.css';

const BLOCK_COLORS: Record<BlockType, string> = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#228b22',
};

export default function LayerBrowser() {
  const voxels = useTreeStore((s) => s.voxels);
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const setActiveLayer = useTreeStore((s) => s.setActiveLayer);

  const sortedYs = useMemo(
    () => Array.from(voxels.layers.keys()).sort((a, b) => a - b),
    [voxels],
  );

  const minY = sortedYs[0] ?? 0;
  const maxY = sortedYs[sortedYs.length - 1] ?? 0;

  const clampedLayer = Math.max(minY, Math.min(maxY, activeLayer));

  const layerData = voxels.layers.get(clampedLayer);

  const cells = useMemo(() => {
    if (!layerData) return [];
    const result: Array<{ x: number; z: number; type: BlockType }> = [];
    for (const [key, type] of layerData) {
      const [x, z] = unpack(key);
      result.push({ x, z, type });
    }
    return result;
  }, [layerData]);

  const gridMinX = cells.length > 0 ? Math.min(...cells.map((c) => c.x)) : 0;
  const gridMaxX = cells.length > 0 ? Math.max(...cells.map((c) => c.x)) : 0;
  const gridMinZ = cells.length > 0 ? Math.min(...cells.map((c) => c.z)) : 0;
  const gridMaxZ = cells.length > 0 ? Math.max(...cells.map((c) => c.z)) : 0;
  const gridW = gridMaxX - gridMinX + 1;
  const gridH = gridMaxZ - gridMinZ + 1;

  const cellMap = useMemo(() => {
    const m = new Map<string, BlockType>();
    for (const c of cells) {
      m.set(`${c.x},${c.z}`, c.type);
    }
    return m;
  }, [cells]);

  const maxDim = Math.max(gridW, gridH, 1);
  const cellSize = Math.max(10, Math.min(16, Math.floor(280 / maxDim)));
  const axisSize = Math.max(cellSize, 20);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Layer View</span>
        <span className={styles.layerInfo}>
          Y={clampedLayer} ({layerData?.size ?? 0} blocks)
        </span>
      </div>

      <Slider.Root
        className={styles.slider}
        min={minY}
        max={maxY}
        step={1}
        value={[clampedLayer]}
        onValueChange={([v]) => setActiveLayer(v)}
        orientation="horizontal"
      >
        <Slider.Track className={styles.track}>
          <Slider.Range className={styles.range} />
        </Slider.Track>
        <Slider.Thumb className={styles.thumb} />
      </Slider.Root>

      <div className={styles.gridContainer}>
        {cells.length === 0 ? (
          <div className={styles.empty}>Empty layer</div>
        ) : (
          <div
            className={styles.axisFrame}
            style={{
              gridTemplateColumns: `${axisSize}px repeat(${gridW}, ${cellSize}px)`,
              gridTemplateRows: `${axisSize}px repeat(${gridH}, ${cellSize}px)`,
            }}
          >
            <div className={styles.corner}>Z/X</div>
            {Array.from({ length: gridW }, (_, col) => {
              const x = gridMinX + col;
              return (
                <div key={`x-${x}`} className={styles.axisCell} title={`X=${x}`}>
                  {x}
                </div>
              );
            })}
            {Array.from({ length: gridH }, (_, row) => {
              const z = gridMinZ + row;
              return (
                <div key={`z-${z}`} className={styles.axisCell} title={`Z=${z}`}>
                  {z}
                </div>
              );
            })}
            <div
              className={styles.grid}
              style={{
                gridColumn: `2 / span ${gridW}`,
                gridRow: `2 / span ${gridH}`,
                gridTemplateColumns: `repeat(${gridW}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${gridH}, ${cellSize}px)`,
              }}
            >
              {Array.from({ length: gridH }, (_, row) =>
                Array.from({ length: gridW }, (_, col) => {
                  const x = gridMinX + col;
                  const z = gridMinZ + row;
                  const type = cellMap.get(`${x},${z}`);
                  return (
                    <div
                      key={`${x},${z}`}
                      className={styles.cell}
                      style={{
                        backgroundColor: type ? BLOCK_COLORS[type] : 'transparent',
                        border: type ? 'none' : '1px solid #1a1a2e',
                      }}
                      title={type ? `(${x}, ${z}) ${type}` : `(${x}, ${z})`}
                    />
                  );
                }),
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.navBtn}
          onClick={() => setActiveLayer(Math.max(minY, clampedLayer - 1))}
          disabled={clampedLayer <= minY}
        >
          Down
        </button>
        <button
          className={styles.navBtn}
          onClick={() => setActiveLayer(Math.min(maxY, clampedLayer + 1))}
          disabled={clampedLayer >= maxY}
        >
          Up
        </button>
      </div>
    </div>
  );
}
