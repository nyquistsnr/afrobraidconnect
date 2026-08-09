import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";
import { HomePageShell } from "@/components/home/home-page-shell";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <HomePageShell
      lang={lang}
      siteHeaderDict={dict.siteHeader}
      common={dict.common}
      notificationsDict={dict.notifications}
      heroDict={{
        title: dict.home.title,
        subtitle: dict.home.subtitle,
        startSearch: dict.siteHeader.startSearch,
        styleGalleryAlt: dict.home.styleGalleryAlt,
        appointmentsBooked: dict.home.appointmentsBooked,
      }}
      howItWorksDict={dict.home.howItWorks}
      growBusinessDict={dict.home.growBusiness}
      testimonialsDict={dict.home.testimonials}
      faqsDict={dict.home.faqs}
      footerDict={dict.common.footer}
    />
  );
}
