import Image from "next/image";

// Filenames are placeholders — drop matching files into public/images/hero/
// to wire real photos in. The 2nd/4th tiles sit lower on desktop for a
// slightly editorial, non-grid feel; mobile collapses to an even 2x2.
const STYLES = [
  { src: "/images/home/person1.webp", raised: false },
  { src: "/images/home/person2.webp", raised: true },
  { src: "/images/home/person3.webp", raised: true },
  { src: "/images/home/person4.webp", raised: false },
];

export function HeroStyleGallery({ alt }: { alt: string }) {
  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {STYLES.map((style, index) => (
        <div
          key={style.src}
          className={`group relative aspect-[3/4] overflow-hidden rounded-2xl bg-border/40 shadow-sm ring-1 ring-black/5 ${
            style.raised ? "md:mt-7" : ""
          }`}
        >
          <Image
            src={style.src}
            alt={`${alt} ${index + 1}`}
            fill
            sizes="(min-width: 768px) 22vw, 45vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
