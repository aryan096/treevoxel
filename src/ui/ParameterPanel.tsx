import * as Select from '@radix-ui/react-select';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { PARAMETER_DEFS, CATEGORICAL_PARAMS } from '../core/parameters';
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
              <div key={group}>
                <ParameterGroup
                  group={group}
                  params={groupParams}
                  values={params as unknown as Record<string, number>}
                  onChange={setParam}
                />
                {/* Render categorical params for this group */}
                {CATEGORICAL_PARAMS
                  .filter((cp) => cp.group === group)
                  .map((cp) => (
                    <div key={cp.id} className={styles.categoricalParam}>
                      <label className={styles.categoricalLabel}>{cp.label}</label>
                      <Select.Root
                        value={params[cp.id] as string}
                        onValueChange={(v) => setParam(cp.id, v)}
                      >
                        <Select.Trigger className={styles.categoricalTrigger}>
                          <Select.Value />
                          <Select.Icon>{'\u25bc'}</Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className={styles.categoricalContent} position="popper" sideOffset={4}>
                            <Select.Viewport>
                              {cp.options.map((opt) => (
                                <Select.Item key={opt} value={opt} className={styles.categoricalItem}>
                                  <Select.ItemText>{opt}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  ))}
              </div>
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
