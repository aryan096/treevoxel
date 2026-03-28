import { useTreeStore } from '../store/treeStore';
import styles from './Toolbar.module.css';

const TOGGLE_LABELS: Record<string, string> = {
  showLog: 'Trunk',
  showBranch: 'Branches',
  showLeaf: 'Leaves',
  showGrid: 'Grid',
  showAxes: 'Axes',
};

export default function Toolbar() {
  const display = useTreeStore((s) => s.display);
  const toggleDisplay = useTreeStore((s) => s.toggleDisplay);

  return (
    <div className={styles.toolbar}>
      {Object.entries(TOGGLE_LABELS).map(([key, label]) => (
        <button
          key={key}
          className={`${styles.toggle} ${display[key as keyof typeof display] ? styles.active : ''}`}
          onClick={() => toggleDisplay(key as keyof typeof display)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
