import { redirect } from "next/navigation";
import { Locale } from "@/lib/i18n";
import { auth } from "@/auth";
import { onboardingApi } from "@/lib/api/onboarding-client";

export default async function PaymentCompletePage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const session = await auth();

  if (!session?.accessToken) {
    redirect(`/${lang}/login`);
  }

  try {
    // Refresh to fetch the latest state from Stripe
    const status = await onboardingApi.refreshPaymentSetupStatus(session.accessToken);
    
    // If completed, push to final onboarding view
    if (status.is_complete) {
      redirect(`/${lang}/onboarding`);
    } else {
      // Otherwise back to the payment setup page to see what's missing
      redirect(`/${lang}/onboarding/payment`);
    }
  } catch (error) {
    console.error("Failed to complete Stripe setup", error);
    redirect(`/${lang}/onboarding/payment`);
  }
}
