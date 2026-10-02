"use client";

import { useRef } from "react";
import s from "./poc.module.css";

type Option = { id: string; label: string };

type Props = {
  label: string;
  idPrefix: string;
  options: readonly Option[];
  value: string;
  onChange: (id: string) => void;
};

/* A tablist with roving focus: arrow keys, Home and End move between options. */
export function Segmented({ label, idPrefix, options, value, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = options.length - 1;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next < 0) return;
    e.preventDefault();
    const option = options[next];
    if (!option) return;
    onChange(option.id);
    refs.current[next]?.focus();
  }

  return (
    <div className={s.seg} role="tablist" aria-label={label}>
      {options.map((o, i) => {
        const selected = o.id === value;
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${o.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            className={s.segBtn}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
