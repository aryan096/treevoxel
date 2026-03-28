import { useEffect, useState } from 'react';
import styles from './App.module.css';
import VoxelScene from './render/VoxelScene';
import ParameterPanel from './ui/ParameterPanel';
import LayerBrowser from './ui/LayerBrowser';
import Toolbar from './ui/Toolbar';
import AboutPanel from './ui/AboutPanel';
import CommunityPanel from './ui/CommunityPanel';
import { useTreeStore } from './store/treeStore';

export default function App() {
  const voxels = useTreeStore((s) => s.voxels);
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const setActiveLayer = useTreeStore((s) => s.setActiveLayer);
  const [activeTab, setActiveTab] = useState<'settings' | 'layers' | 'community' | 'about'>('settings');

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
      <aside className={styles.sidebar}>
        <div className={styles.tabBar} role="tablist" aria-label="Tool panels">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'settings'}
            className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'layers'}
            className={`${styles.tab} ${activeTab === 'layers' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            Layers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'community'}
            className={`${styles.tab} ${activeTab === 'community' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('community')}
          >
            Community
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'about'}
            className={`${styles.tab} ${activeTab === 'about' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        <div className={styles.panelBody}>
          {activeTab === 'settings' ? (
            <div className={styles.settingsPanel} role="tabpanel" aria-label="Settings">
              <ParameterPanel />
            </div>
          ) : activeTab === 'layers' ? (
            <div className={styles.layersPanel} role="tabpanel" aria-label="Layers">
              <LayerBrowser />
            </div>
          ) : activeTab === 'community' ? (
            <div className={styles.communityPanel} role="tabpanel" aria-label="Community">
              <CommunityPanel />
            </div>
          ) : (
            <div className={styles.aboutPanel} role="tabpanel" aria-label="About">
              <AboutPanel />
            </div>
          )}
        </div>
      </aside>
      <div className={styles.viewport}>
        <Toolbar />
        <VoxelScene showSliceHighlight={activeTab === 'layers'} />
      </div>
    </div>
  );
}
