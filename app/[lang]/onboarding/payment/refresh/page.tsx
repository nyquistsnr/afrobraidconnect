import { redirect } from "next/navigation";
import { Locale } from "@/lib/i18n";
import { auth } from "@/auth";
import { onboardingApi } from "@/lib/api/onboarding-client";

export default async function PaymentRefreshPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const session = await auth();

  if (!session?.accessToken) {
    redirect(`/${lang}/login`);
  }

  let url: string | null = null;

  try {
    // Attempt to get a new link
    const link = await onboardingApi.createAccountLink(session.accessToken);
    url = link.onboarding_url;
  } catch (error) {
    console.error("Failed to refresh Stripe link", error);
  }

  if (url) {
    redirect(url);
  } else {
    // If it fails, send them back to the payment setup page
    redirect(`/${lang}/onboarding/payment`);
  }
}
