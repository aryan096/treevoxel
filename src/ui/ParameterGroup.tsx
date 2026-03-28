import { useState } from 'react';
import type { ParameterDef } from '../core/types';
import ParameterSlider from './ParameterSlider';
import styles from './ParameterGroup.module.css';

const GROUP_LABELS: Record<string, string> = {
  dimensions: 'Dimensions',
  trunk: 'Trunk',
  branching: 'Branching',
  crown: 'Crown & Canopy',
  environment: 'Environment',
};

type Props = {
  group: string;
  params: ParameterDef[];
  values: Record<string, number>;
  onChange: (id: string, value: number) => void;
};

export default function ParameterGroup({ group, params, values, onChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className={styles.chevron}>{collapsed ? '\u25b6' : '\u25bc'}</span>
        <span className={styles.title}>{GROUP_LABELS[group] || group}</span>
        <span className={styles.count}>{params.length}</span>
      </button>
      {!collapsed && (
        <div className={styles.body}>
          {params.map((p) => (
            <ParameterSlider
              key={p.id}
              param={p}
              value={values[p.id] ?? p.defaultValue}
              onChange={(v) => onChange(p.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
