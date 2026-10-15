'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/router';

export interface Command {
  id: string;
  /** What you actually type, e.g. "gh". */
  alias: string;
  description: string;
  /** Defaults to "Running <alias>...". */
  feedback?: string;
  run: () => void;
}

/** A page `cd` can jump to -- `name` is what you type, `path` is the route. */
export interface Route {
  name: string;
  path: string;
}

interface Line {
  type: 'prompt' | 'output';
  text: string;
}

const HELP_ALIASES = ['/h', '/help'];
const EXIT_ALIASES = ['exit', 'quit'];
const CLEAR_ALIASES = ['clear'];
const CD_ALIAS = 'cd';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function formatClock(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export interface CommandPaletteProps {
  commands: Command[];
  routes?: Route[];
  shortcutKey?: string;
  /** Identity shown in the prompt, e.g. "nath" -> "@nath". */
  user?: string;
  className?: string;
}

const INITIAL_HISTORY: Line[] = [
  { type: 'output', text: `Type ${HELP_ALIASES[0]} for a list of commands.` },
];

export default function CommandPalette({
  commands,
  routes = [],
  shortcutKey = '/',
  user = 'nath',
  className = '',
}: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Line[]>(INITIAL_HISTORY);
  const [recall, setRecall] = useState<string[]>([]);
  const [recallIndex, setRecallIndex] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const promptLabel = `${user}@web ❯ `;

  // Also wipes the scrollback -- reopening starts a fresh session.
  const close = () => {
    setOpen(false);
    setHistory(INITIAL_HISTORY);
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs to the real clock on open, not derived from other state
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Cmd/Ctrl+K always fires; the bare shortcutKey only fires when nothing editable has focus.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (open) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (e.key !== shortcutKey) return;
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;

      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, shortcutKey]);

  const submit = () => {
    const raw = input.trim();
    if (!raw) return;

    const next: Line[] = [...history, { type: 'prompt', text: raw }];
    const alias = raw.toLowerCase();
    const [firstWord, ...rest] = alias.split(/\s+/);

    if (HELP_ALIASES.includes(alias)) {
      const cdEntry = `${CD_ALIAS} <page>`;
      const width =
        Math.max(
          ...commands.map((c) => c.alias.length),
          EXIT_ALIASES[0].length,
          CLEAR_ALIASES[0].length,
          routes.length ? cdEntry.length : 0
        ) + 2;
      const rows = commands.map((c) => `${c.alias.padEnd(width)}${c.description}`);
      if (routes.length) {
        rows.push(`${cdEntry.padEnd(width)}change page (${routes.map((r) => r.name).join(', ')})`);
      }
      rows.push(`${CLEAR_ALIASES[0].padEnd(width)}clear this terminal's history`);
      rows.push(`${EXIT_ALIASES[0].padEnd(width)}close this terminal`);
      next.push({ type: 'output', text: rows.join('\n') });
    } else if (firstWord === CD_ALIAS && routes.length) {
      const target = rest.join(' ');
      const route = routes.find((r) => r.name.toLowerCase() === target);
      if (route) {
        router.push(route.path, undefined, { scroll: false }); // PageTransition owns scroll
        next.push({ type: 'output', text: `Navigating to ${route.path}...` });
      } else {
        const available = routes.map((r) => r.name).join(', ');
        next.push({
          type: 'output',
          text: target
            ? `cd: no such page: ${target} (available: ${available})`
            : `cd: missing page name (available: ${available})`,
        });
      }
    } else if (CLEAR_ALIASES.includes(alias)) {
      setHistory(INITIAL_HISTORY);
      setRecall((r) => [...r, raw]);
      setRecallIndex(null);
      setInput('');
      return;
    } else if (EXIT_ALIASES.includes(alias)) {
      setRecall((r) => [...r, raw]);
      setRecallIndex(null);
      setInput('');
      close();
      return;
    } else {
      const cmd = commands.find((c) => c.alias.toLowerCase() === alias);
      if (cmd) {
        cmd.run();
        next.push({ type: 'output', text: cmd.feedback ?? `Running ${cmd.alias}...` });
      } else {
        next.push({ type: 'output', text: `command not found: ${raw} (try ${HELP_ALIASES[0]})` });
      }
    }

    setHistory(next);
    setRecall((r) => [...r, raw]);
    setRecallIndex(null);
    setInput('');
  };

  const onInputKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (recall.length === 0) return;
      const i = recallIndex === null ? recall.length - 1 : Math.max(0, recallIndex - 1);
      setRecallIndex(i);
      setInput(recall[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (recallIndex === null) return;
      const i = recallIndex + 1;
      if (i >= recall.length) {
        setRecallIndex(null);
        setInput('');
      } else {
        setRecallIndex(i);
        setInput(recall[i]);
      }
    }
  };

  return (
    <div className={className}>
      {!open && (
        <button
          type="button"
          data-dither-mask
          onClick={() => setOpen(true)}
          // bottom-6 + leading-4 (one h-4 line): centres on the footer's row at
          // the bottom of the page, level with its icons and BackToTop.
          className="fixed bottom-6 left-12 z-40 font-mono text-[11px] leading-4 tracking-wide text-ink-faint uppercase transition-colors hover:text-ink"
        >
          Press <span className="text-accent">{shortcutKey}</span> or{' '}
          <span className="text-accent">
            <span className="inline-block align-middle text-[15px] leading-none">&#8984;</span> + K
          </span>{' '}
          for commands
        </button>
      )}

      <div
        data-dither-mask
        className={`fixed bottom-5 left-12 z-40 flex w-104 max-w-[calc(100vw-6rem)] flex-col overflow-hidden rounded-sm border border-line-lit bg-black/10 backdrop-blur-xl transition-all duration-200 ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 font-mono text-[11px] tracking-widest text-ink-dim uppercase">
          <div className="flex items-center justify-between w-full gap-3 normal-case">
            <span className="tabular-nums">{now ? formatClock(now) : ''}</span>
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="text-[18px] leading-none text-accent transition-colors hover:text-white cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>

        {/* data-lenis-prevent: without it Lenis's global wheel hijack blocks native scroll here. */}
        <div
          ref={scrollRef}
          data-lenis-prevent
          className="max-h-64 overflow-y-auto px-4 pt-3.5 pb-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
        >
          {history.map((line, i) =>
            line.type === 'prompt' ? (
              <div key={i} className="text-ink">
                <span className="text-accent">{promptLabel}</span>
                {line.text}
              </div>
            ) : (
              <div key={i} className="mb-2 text-ink-dim">
                {line.text}
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-line px-4 py-3.5">
          <span className="font-mono text-[11px] whitespace-pre text-accent">{promptLabel}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onInputKeyDown}
            aria-label="Command"
            className="w-full border-0 bg-transparent font-mono text-[11px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
