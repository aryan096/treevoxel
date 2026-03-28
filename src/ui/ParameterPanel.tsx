import * as ScrollArea from '@radix-ui/react-scroll-area';
import { PARAMETER_DEFS } from '../core/parameters';
import { useTreeStore } from '../store/treeStore';
import PresetSelector from './PresetSelector';
import ParameterGroup from './ParameterGroup';
import styles from './ParameterPanel.module.css';

const GROUP_ORDER = ['dimensions', 'trunk', 'branching', 'crown', 'environment', 'minecraft'];

export default function ParameterPanel() {
  const params = useTreeStore((s) => s.params);
  const setParam = useTreeStore((s) => s.setParam);
  const randomizeSeed = useTreeStore((s) => s.randomizeSeed);
  const voxels = useTreeStore((s) => s.voxels);

  const grouped = new Map<string, typeof PARAMETER_DEFS>();
  for (const p of PARAMETER_DEFS) {
    const list = grouped.get(p.group) || [];
    list.push(p);
    grouped.set(p.group, list);
  }

  return (
    <ScrollArea.Root className={styles.root}>
      <ScrollArea.Viewport className={styles.viewport}>
        <div className={styles.inner}>
          <PresetSelector />

          <button className={styles.seedButton} onClick={randomizeSeed}>
            Randomize Seed
          </button>

          {GROUP_ORDER.map((group) => {
            const groupParams = grouped.get(group);
            if (!groupParams) return null;
            return (
              <ParameterGroup
                key={group}
                group={group}
                params={groupParams}
                values={params as unknown as Record<string, number>}
                onChange={setParam}
              />
            );
          })}

          <div className={styles.stats}>
            <span>Blocks: {voxels.count}</span>
            <span>Layers: {voxels.layers.size}</span>
          </div>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={styles.scrollbar} orientation="vertical">
        <ScrollArea.Thumb className={styles.thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
