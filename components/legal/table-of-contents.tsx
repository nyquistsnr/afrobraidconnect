"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export interface Section {
  id: string;
  title: string;
}

export function TableOfContents({ sections, title = "Contents" }: { sections: Section[], title?: string }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find all visible sections
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" } // trigger when near the top
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [sections]);

  return (
    <nav className="sticky top-24 hidden lg:block max-h-[calc(100vh-8rem)] overflow-y-auto w-64 shrink-0">
      <h3 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="space-y-3 border-l border-border pl-4">
        {sections.map((section) => (
          <li key={section.id}>
            <Link
              href={`#${section.id}`}
              className={`block text-sm font-medium transition-colors hover:text-brand ${
                activeId === section.id
                  ? "text-brand"
                  : "text-muted-foreground"
              }`}
            >
              {section.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
