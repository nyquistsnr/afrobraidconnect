import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale } from "../../dictionaries";
import { loginPath } from "@/lib/auth-redirect";
import { SiteHeader } from "@/components/layout/site-header";
import { BookingDetailView } from "@/components/bookings/booking-detail-view";

export default async function BookingDetailPage({
  params,
}: PageProps<"/[lang]/bookings/[bookingId]">) {
  const { lang, bookingId } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) {
    redirect(await loginPath(lang));
  }
  if (session.user.userType !== "CUSTOMER") {
    redirect(`/${lang}`);
  }

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24 md:pb-0">
      <SiteHeader lang={lang} dict={dict.siteHeader} common={dict.common} />
      <BookingDetailView
        bookingId={bookingId}
        lang={lang}
        dict={dict.bookingDetail}
        statusDict={dict.common.bookingStatus}
      />
    </div>
  );
}
