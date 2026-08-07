import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../../dictionaries";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function BookingsPage({
  params,
}: PageProps<"/[lang]/dashboard/bookings">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <h1 className="text-2xl font-bold text-foreground">
      {dict.bookings.title}
    </h1>
  );
}
