import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale } from "../../../dictionaries";
import { loginPath } from "@/lib/auth-redirect";
import { SiteHeader } from "@/components/layout/site-header";
import { BookingCheckoutView } from "@/components/booking-checkout/booking-checkout-view";
import { braidersApi } from "@/lib/api/braiders-client";
import { ApiError } from "@/lib/api/auth-client";
import type { BraiderDetailResponse } from "@/lib/api/types";

export default async function BookingCheckoutPage({
  params,
  searchParams,
}: PageProps<"/[lang]/braiders/[braiderId]/book">) {
  const { lang, braiderId } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) {
    redirect(await loginPath(lang));
  }
  // Booking creation is a CUSTOMER-only endpoint — a braider account landing
  // here (e.g. a shared link) has nothing to do but go back to the profile.
  if (session.user.userType !== "CUSTOMER") {
    redirect(`/${lang}/braiders/${braiderId}`);
  }

  const sp = await searchParams;
  const calculationIdParam = sp.calculation_id;
  const startsAtParam = sp.starts_at;
  const calculationId = Array.isArray(calculationIdParam)
    ? calculationIdParam[0]
    : calculationIdParam;
  const startsAt = Array.isArray(startsAtParam) ? startsAtParam[0] : startsAtParam;

  // No quote/time to check out with — send the customer back to configure
  // their booking rather than rendering a broken page.
  if (!calculationId || !startsAt) {
    redirect(`/${lang}/braiders/${braiderId}`);
  }

  const dict = await getDictionary(lang);

  let braider: BraiderDetailResponse | null = null;
  try {
    braider = await braidersApi.getById(braiderId, lang);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader lang={lang} dict={dict.siteHeader} common={dict.common} />
      <BookingCheckoutView
        lang={lang}
        braider={braider}
        calculationId={calculationId}
        startsAt={startsAt}
        dict={dict.bookingCheckout}
        errorsDict={dict.common.errors}
      />
    </div>
  );
}
