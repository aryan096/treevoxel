import { useTreeStore } from '../store/treeStore';
import { exportJSON, exportTextGuide } from '../core/export';
import styles from './ExportPanel.module.css';

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPanel() {
  const voxels = useTreeStore((s) => s.voxels);
  const params = useTreeStore((s) => s.params);

  const handleExportJSON = () => {
    const json = exportJSON(voxels, params);
    downloadFile(json, 'treevoxel-export.json', 'application/json');
  };

  const handleExportText = () => {
    const guide = exportTextGuide(voxels);
    downloadFile(guide, 'treevoxel-build-guide.txt', 'text/plain');
  };

  return (
    <div className={styles.container}>
      <span className={styles.title}>Export</span>
      <div className={styles.buttons}>
        <button className={styles.btn} onClick={handleExportJSON}>
          JSON
        </button>
        <button className={styles.btn} onClick={handleExportText}>
          Build Guide
        </button>
      </div>
    </div>
  );
}
