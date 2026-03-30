import type { CSSProperties } from 'react';
import * as Select from '@radix-ui/react-select';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import type { MinecraftPalette, ParameterDef } from '../core/types';
import { PARAMETER_DEFS, CATEGORICAL_PARAMS } from '../core/parameters';
import { exportJSON, exportTextGuide, exportLitematic } from '../core/export';
import { getPresetsForCategory } from '../core/minecraftBlocks';
import { useTreeStore } from '../store/treeStore';
import PresetSelector from './PresetSelector';
import ParameterGroup from './ParameterGroup';
import ParameterSlider from './ParameterSlider';
import styles from './ParameterPanel.module.css';

const GROUP_ORDER = ['dimensions', 'trunk', 'branching', 'crown', 'environment'];
const FEATURED_PARAM_IDS = ['colorRandomness', 'randomSeed'] as const;
const MC_BLOCK_TYPES = ['log', 'branch', 'leaf'] as const;
type McBlockType = (typeof MC_BLOCK_TYPES)[number];
const BLOCK_TYPE_LABELS: Record<McBlockType, string> = {
  log: 'Log',
  branch: 'Branch',
  leaf: 'Leaf',
};
const SCROLLBAR_WIDTH = 7;

function formatOptionLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatBlockLabel(value: string): string {
  return value
    .split('_')
    .map((part) => formatOptionLabel(part))
    .join(' ');
}

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ParameterPanel() {
  const params = useTreeStore((s) => s.params);
  const setParam = useTreeStore((s) => s.setParam);
  const randomizeSeed = useTreeStore((s) => s.randomizeSeed);
  const voxels = useTreeStore((s) => s.voxels);
  const blockColors = useTreeStore((s) => s.blockColors);
  const minecraftPalette = useTreeStore((s) => s.minecraftPalette);
  const setBlockColor = useTreeStore((s) => s.setBlockColor);
  const setMinecraftPaletteEntry = useTreeStore((s) => s.setMinecraftPaletteEntry);

  const grouped = new Map<string, typeof PARAMETER_DEFS>();
  for (const p of PARAMETER_DEFS) {
    const list = grouped.get(p.group) || [];
    list.push(p);
    grouped.set(p.group, list);
  }
  const featuredParams: ParameterDef[] = FEATURED_PARAM_IDS
    .map((id) => PARAMETER_DEFS.find((p) => p.id === id))
    .filter((param): param is ParameterDef => Boolean(param));

  const handleExportJSON = () => {
    downloadFile(exportJSON(voxels, params), 'treevoxel-export.json', 'application/json');
  };

  const handleExportText = () => {
    downloadFile(exportTextGuide(voxels), 'treevoxel-build-guide.txt', 'text/plain');
  };

  const handleExportLitematic = () => {
    const data = exportLitematic(voxels, minecraftPalette);
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'treevoxel-export.litematic';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ScrollArea.Root
      className={styles.root}
      style={{ '--scrollbar-width': `${SCROLLBAR_WIDTH}px` } as CSSProperties}
    >
      <ScrollArea.Viewport className={styles.viewport}>
        <div className={styles.inner}>
          <PresetSelector />

          <section className={styles.colorSection}>
            <div className={styles.colorSectionHeader}>
              <span className={styles.colorSectionTitle}>Block Colors</span>
              <span className={styles.colorSectionCount}>3</span>
            </div>
            <div className={styles.colorGrid}>
              {MC_BLOCK_TYPES.map((type) => {
                const paletteKey = type as keyof MinecraftPalette;
                const mcPresets = getPresetsForCategory(type);
                return (
                  <div key={type} className={styles.colorField}>
                    <span className={styles.colorLabel}>{BLOCK_TYPE_LABELS[type]}</span>
                    <Select.Root
                      value={minecraftPalette[paletteKey]}
                      onValueChange={(blockId) => {
                        const preset = mcPresets.find((item) => item.id === blockId);
                        if (preset) {
                          setMinecraftPaletteEntry(paletteKey, blockId, preset.approximateHex);
                        }
                      }}
                    >
                      <Select.Trigger className={styles.mcBlockTrigger}>
                        <Select.Value />
                        <Select.Icon>{'\u25bc'}</Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className={styles.mcBlockContent} position="popper" sideOffset={4}>
                          <Select.Viewport>
                            {mcPresets.map((preset) => (
                              <Select.Item key={preset.id} value={preset.id} className={styles.mcBlockItem}>
                                <span
                                  className={styles.mcBlockSwatch}
                                  style={{ backgroundColor: preset.approximateHex }}
                                />
                                <Select.ItemText>{formatBlockLabel(preset.label)}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                    <div className={styles.colorControl}>
                      <input
                        className={styles.colorInput}
                        type="color"
                        value={blockColors[type]}
                        aria-label={`${BLOCK_TYPE_LABELS[type]} color`}
                        onChange={(event) => setBlockColor(type, event.target.value)}
                      />
                      <span className={styles.colorValue}>{blockColors[type].toUpperCase()}</span>
                    </div>
                    {type === 'branch' ? (
                      <details className={styles.branchDetails}>
                        <summary className={styles.branchDetailsSummary}>Branch details</summary>
                        <div className={styles.fenceRow}>
                          <span className={styles.colorLabel}>Fence block</span>
                          <Select.Root
                            value={minecraftPalette.fence}
                            onValueChange={(blockId) => {
                              setMinecraftPaletteEntry('fence', blockId, '');
                            }}
                          >
                            <Select.Trigger className={styles.mcBlockTrigger}>
                              <Select.Value />
                              <Select.Icon>{'\u25bc'}</Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                              <Select.Content className={styles.mcBlockContent} position="popper" sideOffset={4}>
                                <Select.Viewport>
                                  {getPresetsForCategory('fence').map((preset) => (
                                    <Select.Item key={preset.id} value={preset.id} className={styles.mcBlockItem}>
                                      <span
                                        className={styles.mcBlockSwatch}
                                        style={{ backgroundColor: preset.approximateHex }}
                                      />
                                      <Select.ItemText>{formatBlockLabel(preset.label)}</Select.ItemText>
                                    </Select.Item>
                                  ))}
                                </Select.Viewport>
                              </Select.Content>
                            </Select.Portal>
                          </Select.Root>
                        </div>
                      </details>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.featuredSection}>
            {featuredParams.map((param) => (
              <ParameterSlider
                key={param.id}
                param={param}
                value={(params as unknown as Record<string, number>)[param.id] ?? param.defaultValue}
                onChange={(value) => setParam(param.id, value)}
                action={param.id === 'randomSeed'
                  ? {
                      label: 'Randomize',
                      icon: '\u27f3',
                      onClick: randomizeSeed,
                    }
                  : undefined}
              />
            ))}
          </section>

          {GROUP_ORDER.map((group) => {
            const groupParams = (grouped.get(group) || []).filter(
              (param) => !FEATURED_PARAM_IDS.includes(param.id as (typeof FEATURED_PARAM_IDS)[number]),
            );
            if (!groupParams) return null;
            if (groupParams.length === 0) return null;
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
                          <Select.Value aria-label={formatOptionLabel(params[cp.id] as string)}>
                            {formatOptionLabel(params[cp.id] as string)}
                          </Select.Value>
                          <Select.Icon>{'\u25bc'}</Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className={styles.categoricalContent} position="popper" sideOffset={4}>
                            <Select.Viewport>
                              {cp.options.map((opt) => (
                                <Select.Item key={opt} value={opt} className={styles.categoricalItem}>
                                  <Select.ItemText>{formatOptionLabel(opt)}</Select.ItemText>
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
          <section className={styles.exportSection}>
            <span className={styles.exportTitle}>Export</span>
            <div className={styles.exportButtons}>
              <button type="button" className={styles.exportButton} onClick={handleExportJSON}>
                JSON
              </button>
              <button type="button" className={styles.exportButton} onClick={handleExportText}>
                Build Guide
              </button>
              <button type="button" className={styles.exportButton} onClick={handleExportLitematic}>
                Litematica (.litematic)
              </button>
            </div>
          </section>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className={styles.scrollbar}
        orientation="vertical"
      >
        <ScrollArea.Thumb className={styles.thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
