import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { ParameterDef } from '../core/types';
import styles from './ParameterSlider.module.css';

type Props = {
  param: ParameterDef;
  value: number;
  onChange: (value: number) => void;
  action?: {
    label: string;
    icon: string;
    onClick: () => void;
  };
};

export default function ParameterSlider({ param, value, onChange, action }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <label className={styles.label}>{param.label}</label>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} side="left" sideOffset={8}>
                <p className={styles.tooltipDesc}>{param.description}</p>
                <p className={styles.tooltipEffect}>
                  <span className={styles.up}>+</span> {param.effectIncrease}
                </p>
                <p className={styles.tooltipEffect}>
                  <span className={styles.down}>-</span> {param.effectDecrease}
                </p>
                <Tooltip.Arrow className={styles.tooltipArrow} />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        <span className={styles.value}>{Number.isInteger(param.step) ? value : value.toFixed(2)}</span>
      </div>
      <div className={styles.controlRow}>
        <Slider.Root
          className={styles.slider}
          min={param.min}
          max={param.max}
          step={param.step}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
        >
          <Slider.Track className={styles.track}>
            <Slider.Range className={styles.range} />
          </Slider.Track>
          <Slider.Thumb className={styles.thumb} />
        </Slider.Root>
        {action ? (
          <button type="button" className={styles.actionButton} onClick={action.onClick} aria-label={action.label}>
            <span>{action.label}</span>
            <span className={styles.actionIcon} aria-hidden="true">{action.icon}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
