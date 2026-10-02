"use client";

import { useEffect, useState } from "react";
import s from "./poc.module.css";

type Item = { id: string; label: string };

/* Sticky act navigation. Marks the act in view, and opens the annex when a ledger citation is followed. */
export function SectionNav({ items, name }: { items: readonly Item[]; name: string }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0];
        if (first) setActive(first.target.id);
      },
      { rootMargin: "-56px 0px -55% 0px", threshold: 0 },
    );
    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    function openFor(hash: string) {
      if (!hash.startsWith("#claim-")) return;
      const target = document.getElementById(hash.slice(1));
      const details = target?.closest("details");
      if (details && !details.open) details.open = true;
      target?.scrollIntoView({ block: "center" });
    }
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a[href^='#claim-']");
      if (!a) return;
      const hash = a.getAttribute("href") ?? "";
      e.preventDefault();
      history.pushState(null, "", hash);
      openFor(hash);
    }
    openFor(window.location.hash);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <nav className={s.nav} aria-label="Sections">
      <div className={`${s.wrap} ${s.navInner}`}>
        <a className={s.navName} href="#overview">
          {name} <span>· for Zenity</span>
        </a>
        <ul className={s.navList}>
          {items.map((i) => (
            <li key={i.id}>
              <a
                className={s.navLink}
                href={`#${i.id}`}
                aria-current={active === i.id ? "true" : undefined}
              >
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
