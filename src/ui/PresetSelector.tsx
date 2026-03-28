import * as Select from '@radix-ui/react-select';
import { PRESETS } from '../core/presets';
import { useTreeStore } from '../store/treeStore';
import type { PresetId } from '../core/types';
import styles from './PresetSelector.module.css';

export default function PresetSelector() {
  const presetId = useTreeStore((s) => s.presetId);
  const setPreset = useTreeStore((s) => s.setPreset);

  return (
    <div className={styles.container}>
      <label className={styles.label}>Species Preset</label>
      <Select.Root value={presetId} onValueChange={(v) => setPreset(v as PresetId)}>
        <Select.Trigger className={styles.trigger}>
          <Select.Value />
          <Select.Icon className={styles.icon}>{'\u25bc'}</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={styles.content} position="popper" sideOffset={4}>
            <Select.Viewport>
              {PRESETS.map((preset) => (
                <Select.Item key={preset.id} value={preset.id} className={styles.item}>
                  <Select.ItemText>{preset.name}</Select.ItemText>
                  <div className={styles.itemDesc}>{preset.description}</div>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
