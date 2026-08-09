"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type FaqAudience = "all" | "customer" | "braider";

export interface FaqItemDict {
  audience: string;
  question: string;
  answer: string;
}

export interface FaqsDict {
  badge: string;
  title: string;
  subtitle: string;
  tabAll: string;
  tabCustomer: string;
  tabBraider: string;
  items: FaqItemDict[];
}

export function Faqs({ dict }: { dict: FaqsDict }) {
  const [activeTab, setActiveTab] = useState<FaqAudience>("all");
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    dict.items[0]?.question ?? null,
  );

  const tabs: { value: FaqAudience; label: string }[] = [
    { value: "all", label: dict.tabAll },
    { value: "customer", label: dict.tabCustomer },
    { value: "braider", label: dict.tabBraider },
  ];

  const visibleItems = dict.items.filter(
    (item) => activeTab === "all" || item.audience === activeTab || item.audience === "all",
  );

  function toggleQuestion(question: string) {
    setOpenQuestion((current) => (current === question ? null : question));
  }

  return (
    <section className="bg-background px-6 py-14 md:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex w-fit items-center rounded-full border border-brand px-4 py-1.5 text-sm font-semibold text-brand">
            {dict.badge}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {dict.title}
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">
            {dict.subtitle}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex gap-1 rounded-full bg-surface p-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.value
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {visibleItems.map((item) => {
            const isOpen = openQuestion === item.question;
            return (
              <div
                key={item.question}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-brand/40 bg-hero/40 shadow-sm"
                    : "border-border bg-surface hover:border-border/80 hover:bg-surface/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleQuestion(item.question)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span
                    className={`text-base font-semibold transition-colors duration-300 sm:text-lg ${
                      isOpen ? "text-brand" : "text-foreground group-hover:text-brand/80"
                    }`}
                  >
                    {item.question}
                  </span>
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      isOpen
                        ? "bg-brand text-brand-foreground rotate-45"
                        : "bg-surface text-muted-foreground ring-1 ring-border group-hover:bg-border/50 group-hover:text-foreground"
                    }`}
                  >
                    <Plus className="size-4" />
                  </div>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 pt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
