import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.layout}>
      <div className={styles.viewport}>3D Viewport</div>
      <div className={styles.sidebar}>
        <div className={styles.parameters}>Parameters</div>
        <div className={styles.layers}>Layer Browser</div>
      </div>
    </div>
  );
}
