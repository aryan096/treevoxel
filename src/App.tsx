import styles from './App.module.css';
import VoxelScene from './render/VoxelScene';

export default function App() {
  return (
    <div className={styles.layout}>
      <div className={styles.viewport}>
        <VoxelScene />
      </div>
      <div className={styles.sidebar}>
        <div className={styles.parameters}>Parameters (coming next)</div>
        <div className={styles.layers}>Layer Browser (coming next)</div>
      </div>
    </div>
  );
}
