import { useEffect } from 'react';
import styles from './App.module.css';
import VoxelScene from './render/VoxelScene';
import ParameterPanel from './ui/ParameterPanel';
import LayerBrowser from './ui/LayerBrowser';
import Toolbar from './ui/Toolbar';
import ExportPanel from './ui/ExportPanel';
import { useTreeStore } from './store/treeStore';

export default function App() {
  const voxels = useTreeStore((s) => s.voxels);
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const setActiveLayer = useTreeStore((s) => s.setActiveLayer);

  useEffect(() => {
    const sortedYs = Array.from(voxels.layers.keys()).sort((a, b) => a - b);
    const minY = sortedYs[0] ?? 0;
    const maxY = sortedYs[sortedYs.length - 1] ?? 0;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveLayer(Math.min(maxY, activeLayer + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveLayer(Math.max(minY, activeLayer - 1));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [voxels, activeLayer, setActiveLayer]);

  return (
    <div className={styles.layout}>
      <div className={styles.viewport}>
        <Toolbar />
        <VoxelScene />
      </div>
      <div className={styles.sidebar}>
        <ParameterPanel />
        <LayerBrowser />
        <ExportPanel />
      </div>
    </div>
  );
}
