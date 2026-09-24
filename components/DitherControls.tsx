'use client';

/**
 * DitherControls.tsx
 *
 * Live tuning panel for <DitherBackground>. Controlled component -- reports
 * edits via `onChange` rather than owning the config itself.
 *
 * Auto-saves to localStorage and restores on load. "Copy config" (under
 * Export) gives a paste-ready object to promote into DEFAULT_CONFIG.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { DEFAULT_CONFIG, type DitherBackgroundConfig } from './DitherBackground';

export interface DitherControlsProps {
  value: DitherBackgroundConfig;
  onChange: (next: DitherBackgroundConfig) => void;
  onFirePulse?: () => void;
  defaultOpen?: boolean;
  className?: string;
  /** localStorage key used to persist edits across reloads. Pass `false` to
   *  disable persistence. */
  storageKey?: string | false;
}

type NumericKey = {
  [K in keyof DitherBackgroundConfig]: DitherBackgroundConfig[K] extends number ? K : never;
}[keyof DitherBackgroundConfig];

const DEFAULT_STORAGE_KEY = 'dither-background-config';

// Fixed order so the exported object always reads the same as the interface,
// regardless of key order after a JSON round-trip.
const CONFIG_KEYS: (keyof DitherBackgroundConfig)[] = [
  'pixelSize', 'matrix', 'levels', 'dither',
  'scale', 'warp', 'octaves', 'speed',
  'ambientLow', 'ambientHigh',
  'cursorRadius', 'cursorLift', 'cursorEase', 'cursorFadeSpeed',
  'pulseDuration', 'pulseWidth', 'pulseLift',
  'ground', 'peak',
];

function formatConfig(cfg: DitherBackgroundConfig): string {
  const lines = CONFIG_KEYS.map((key) => {
    const v = cfg[key];
    return `  ${key}: ${typeof v === 'string' ? `'${v}'` : v},`;
  });
  return `{\n${lines.join('\n')}\n}`;
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  note,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  note?: string;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-[10px] tracking-wide text-ink-dim">
        <span>{label}</span>
        <output className="font-mono text-[10px] tabular-nums text-accent">
          {(format ?? ((v: number) => v.toFixed(2)))(value)}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-4 w-full cursor-pointer appearance-none bg-transparent
          [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-ink-faint
          [&::-moz-range-track]:h-px [&::-moz-range-track]:bg-ink-faint
          [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-2.5
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[1px] [&::-webkit-slider-thumb]:bg-ink
          [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-[1px] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink"
      />
      {note && <p className="text-[9px] leading-relaxed tracking-wide text-ink-faint">{note}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3 border-0 border-t border-line p-0 pt-3.5 first:border-t-0 first:pt-0">
      <legend className="mb-0 p-0 text-[9px] tracking-[0.2em] text-ink-faint uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function DitherControls({
  value,
  onChange,
  onFirePulse,
  defaultOpen = false,
  className = '',
  storageKey = DEFAULT_STORAGE_KEY,
}: DitherControlsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [exportText, setExportText] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const uid = useId();

  const set = <K extends NumericKey>(key: K, v: number) => onChange({ ...value, [key]: v });

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) onChange({ ...DEFAULT_CONFIG, ...JSON.parse(raw) });
    } catch {
      // Corrupt or inaccessible storage -- just keep whatever we were passed.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange identity doesn't matter for this one-time restore
  }, []);

  // Skips the first run so the pre-restore value above can't clobber a saved config.
  const skipNextPersist = useRef(true);
  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage full or unavailable (e.g. private browsing) -- fine to skip.
    }
  }, [storageKey, value]);

  const handleExport = async () => {
    const text = formatConfig(value);
    try {
      await navigator.clipboard.writeText(text);
      setExportText(null);
      setFeedback('Copied to clipboard');
    } catch {
      setExportText(text);
      setFeedback(null);
    }
    window.setTimeout(() => setFeedback(null), 1800);
  };

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${uid}-panel`}
        onClick={() => setOpen((o) => !o)}
        data-dither-mask
        className="fixed right-5 bottom-5 z-30 rounded-sm border border-line bg-panel px-3.5 py-2.5 font-mono text-[10px] tracking-wide text-ink uppercase backdrop-blur-md hover:border-ink-faint"
      >
        {open ? 'Hide controls' : 'Controls'}
      </button>

      {open && (
        <div
          id={`${uid}-panel`}
          data-dither-mask
          className="fixed top-5 right-5 bottom-[68px] z-40 flex w-[286px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-sm border border-line bg-panel backdrop-blur-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-3.5 py-3 font-mono text-[10px] tracking-[0.16em] text-ink-dim uppercase">
            <span>Field parameters</span>
          </div>

          {/* data-lenis-prevent: without it Lenis's global wheel hijack blocks native scroll here. */}
          <div data-lenis-prevent className="grid gap-3.5 overflow-y-auto px-3.5 py-3.5 font-mono">
            <Section title="Resolution">
              <Slider
                id={`${uid}-pixel`}
                label="Pixel size"
                value={value.pixelSize}
                min={1}
                max={10}
                step={1}
                format={(v) => `${v}×`}
                onChange={(v) => set('pixelSize', v)}
                note="The whole performance story. Buffer is viewport ÷ this, upscaled with image-rendering: pixelated."
              />
            </Section>

            <Section title="Dither">
              <div className="grid gap-1">
                <label htmlFor={`${uid}-matrix`} className="text-[10px] tracking-wide text-ink-dim">
                  Bayer matrix
                </label>
                <select
                  id={`${uid}-matrix`}
                  value={value.matrix}
                  onChange={(e) => onChange({ ...value, matrix: parseInt(e.target.value, 10) as 2 | 4 | 8 })}
                  className="w-full rounded-sm border border-line bg-white/[0.04] px-2 py-1.5 font-mono text-[11px] text-ink"
                >
                  <option value={2}>2 × 2 — coarse</option>
                  <option value={4}>4 × 4</option>
                  <option value={8}>8 × 8 — PS1-like</option>
                </select>
              </div>
              <Slider
                id={`${uid}-levels`}
                label="Tone levels"
                value={value.levels}
                min={2}
                max={10}
                step={1}
                format={(v) => `${v} steps`}
                onChange={(v) => set('levels', v)}
                note="Fewer levels, heavier crosshatch. Two is pure 1-bit."
              />
              <Slider
                id={`${uid}-dither`}
                label="Dither strength"
                value={value.dither}
                min={0}
                max={1.6}
                step={0.05}
                onChange={(v) => set('dither', v)}
              />
            </Section>

            <Section title="Pattern">
              <Slider
                id={`${uid}-scale`}
                label="Scale"
                value={value.scale}
                min={0.6}
                max={6}
                step={0.1}
                onChange={(v) => set('scale', v)}
              />
              <Slider
                id={`${uid}-warp`}
                label="Domain warp"
                value={value.warp}
                min={0}
                max={6}
                step={0.1}
                onChange={(v) => set('warp', v)}
                note="Zero is plain FBM. Higher values produce the liquid ribbons."
              />
              <Slider
                id={`${uid}-octaves`}
                label="Octaves"
                value={value.octaves}
                min={1}
                max={6}
                step={1}
                format={(v) => String(v)}
                onChange={(v) => set('octaves', v)}
                note="Cost is roughly octaves × 5 noise samples per pixel."
              />
              <Slider
                id={`${uid}-speed`}
                label="Drift speed"
                value={value.speed}
                min={0}
                max={1.5}
                step={0.01}
                onChange={(v) => set('speed', v)}
              />
            </Section>

            <Section title="Tone range">
              <Slider
                id={`${uid}-lo`}
                label="Ambient floor"
                value={value.ambientLow}
                min={0}
                max={0.6}
                step={0.01}
                onChange={(v) => set('ambientLow', v)}
              />
              <Slider
                id={`${uid}-hi`}
                label="Ambient ceiling"
                value={value.ambientHigh}
                min={0.1}
                max={1}
                step={0.01}
                onChange={(v) => set('ambientHigh', v)}
                note="Leave headroom above the ceiling so the cursor has somewhere brighter to go."
              />
            </Section>

            <Section title="Cursor">
              <Slider
                id={`${uid}-cr`}
                label="Radius"
                value={value.cursorRadius}
                min={0.05}
                max={1}
                step={0.01}
                onChange={(v) => set('cursorRadius', v)}
              />
              <Slider
                id={`${uid}-cs`}
                label="Lift"
                value={value.cursorLift}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => set('cursorLift', v)}
              />
              <Slider
                id={`${uid}-ease`}
                label="Follow easing"
                value={value.cursorEase}
                min={0.02}
                max={1}
                step={0.01}
                onChange={(v) => set('cursorEase', v)}
                note="Lower trails further behind the pointer."
              />
              <Slider
                id={`${uid}-fade`}
                label="Mask fade speed"
                value={value.cursorFadeSpeed}
                min={1}
                max={20}
                step={0.5}
                onChange={(v) => set('cursorFadeSpeed', v)}
                note="How fast the glow shrinks/fades out over content marked data-dither-mask, and expands/fades back in over free space."
              />
            </Section>

            <Section title="Navigation pulse">
              <Slider
                id={`${uid}-pdur`}
                label="Duration"
                value={value.pulseDuration}
                min={0.3}
                max={2.5}
                step={0.05}
                format={(v) => `${v.toFixed(2)}s`}
                onChange={(v) => set('pulseDuration', v)}
              />
              <Slider
                id={`${uid}-pw`}
                label="Ring width"
                value={value.pulseWidth}
                min={0.02}
                max={0.6}
                step={0.01}
                onChange={(v) => set('pulseWidth', v)}
              />
              <Slider
                id={`${uid}-ps`}
                label="Lift"
                value={value.pulseLift}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => set('pulseLift', v)}
              />
              {onFirePulse && (
                <button
                  type="button"
                  onClick={onFirePulse}
                  className="rounded-sm border border-accent/50 bg-white/5 px-1.5 py-2 font-mono text-[10px] tracking-wide text-accent uppercase hover:bg-white/10"
                >
                  Fire pulse
                </button>
              )}
            </Section>

            <Section title="Colour">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <label htmlFor={`${uid}-bg`} className="text-[10px] tracking-wide text-ink-dim">
                    Ground
                  </label>
                  <input
                    id={`${uid}-bg`}
                    type="color"
                    value={value.ground}
                    onChange={(e) => onChange({ ...value, ground: e.target.value })}
                    className="h-[26px] w-full cursor-pointer rounded-sm border border-line bg-transparent p-0"
                  />
                </div>
                <div className="grid gap-1">
                  <label htmlFor={`${uid}-fg`} className="text-[10px] tracking-wide text-ink-dim">
                    Peak
                  </label>
                  <input
                    id={`${uid}-fg`}
                    type="color"
                    value={value.peak}
                    onChange={(e) => onChange({ ...value, peak: e.target.value })}
                    className="h-[26px] w-full cursor-pointer rounded-sm border border-line bg-transparent p-0"
                  />
                </div>
              </div>
              <p className="text-[9px] leading-relaxed text-ink-faint">
                Ground is the darkest quantised step, peak the brightest the cursor can reach.
              </p>
            </Section>

            <Section title="Export">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-sm border border-accent/50 bg-white/5 px-1.5 py-2 font-mono text-[10px] tracking-wide text-accent uppercase hover:bg-white/10"
              >
                Copy config
              </button>
              {feedback && <p className="text-[9px] tracking-wide text-accent">{feedback}</p>}
              {exportText && (
                <>
                  <textarea
                    readOnly
                    value={exportText}
                    onClick={(e) => e.currentTarget.select()}
                    rows={CONFIG_KEYS.length + 2}
                    className="w-full resize-none rounded-sm border border-line bg-white/[0.04] p-2 font-mono text-[10px] leading-relaxed text-ink-dim"
                  />
                  <p className="text-[9px] leading-relaxed text-ink-faint">
                    Clipboard access failed -- select the text above and copy manually.
                  </p>
                </>
              )}
              <p className="text-[9px] leading-relaxed text-ink-faint">
                Paste over DEFAULT_CONFIG in DitherBackground.tsx to make these the new defaults.
              </p>
            </Section>

            <Section title="Reset">
              <button
                type="button"
                onClick={() => onChange({ ...DEFAULT_CONFIG })}
                className="rounded-sm border border-line bg-white/5 px-1.5 py-2 font-mono text-[10px] tracking-wide text-ink uppercase hover:border-ink-faint hover:bg-white/10"
              >
                Reset to defaults
              </button>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
