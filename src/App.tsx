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
        <header className={styles.header}>
          <div className={styles.branding}>
            <img src="/logo.svg" alt="Treevoxel" className={styles.logo} />
            <div className={styles.brandText}>
              <span className={styles.appTitle}>Treevoxel</span>
              <span className={styles.subtitle}>Voxel tree authoring tool</span>
            </div>
          </div>
        </header>

        <div className={styles.separator} />

        <nav className={styles.tabBar} role="tablist" aria-label="Tool panels">
          {([
            { id: 'settings' as const, icon: '\u2699', label: 'Settings' },
            { id: 'layers' as const, icon: '\u25eb', label: 'Layers' },
            { id: 'community' as const, icon: '\u2666', label: 'Community' },
            { id: 'about' as const, icon: '\u2139', label: 'About' },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.separator} />

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
