import { useTreeStore } from '../store/treeStore';
import styles from './ViewportLegend.module.css';

export default function ViewportLegend() {
  const voxels = useTreeStore((s) => s.voxels);
  let logCount = 0;
  let branchCount = 0;
  let leafCount = 0;

  for (const layer of voxels.layers.values()) {
    for (const blockType of layer.values()) {
      if (blockType === 'log') {
        logCount++;
        continue;
      }

      if (blockType === 'branch') {
        branchCount++;
        continue;
      }

      leafCount++;
    }
  }

  return (
    <div className={styles.legend} aria-label="Voxel summary">
      <div className={styles.item}>
        <span className={styles.label}>Blocks</span>
        <span className={styles.value}>{voxels.count}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Layers</span>
        <span className={styles.value}>{voxels.layers.size}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Logs</span>
        <span className={styles.value}>{logCount}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Branches</span>
        <span className={styles.value}>{branchCount}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Leaves</span>
        <span className={styles.value}>{leafCount}</span>
      </div>
    </div>
  );
}
