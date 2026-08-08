import { TableOfContents, type Section } from "./table-of-contents";

export function LegalPage({
  title,
  lastUpdated,
  contentsLabel,
  sections,
}: {
  title: string;
  lastUpdated: string;
  contentsLabel?: string;
  sections: {
    id: string;
    title: string;
    paragraphs: string[];
  }[];
}) {
  const tocSections: Section[] = sections.map((s) => ({
    id: s.id,
    title: s.title,
  }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start gap-12 px-6 py-12 md:py-24 lg:flex-row lg:px-12">
      <TableOfContents sections={tocSections} title={contentsLabel} />
      <article className="flex-1 min-w-0">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-foreground">{title}</h1>
        <p className="text-muted-foreground mb-12">{lastUpdated}</p>
        
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-32 mb-12">
            <h2 className="text-2xl font-bold tracking-tight mb-4 text-foreground">{section.title}</h2>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
