import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale } from "../dictionaries";
import { loginPath } from "@/lib/auth-redirect";
import { SiteHeader } from "@/components/layout/site-header";
import { BookingsListView } from "@/components/bookings/bookings-list-view";

export default async function BookingsPage({
  params,
}: PageProps<"/[lang]/bookings">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) {
    redirect(await loginPath(lang));
  }
  // Only customers have bookings to look back on — a braider account
  // landing here has nothing to see.
  if (session.user.userType !== "CUSTOMER") {
    redirect(`/${lang}`);
  }

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader lang={lang} dict={dict.siteHeader} common={dict.common} />
      <BookingsListView
        lang={lang}
        dict={dict.bookingsList}
        statusDict={dict.common.bookingStatus}
      />
    </div>
  );
}
