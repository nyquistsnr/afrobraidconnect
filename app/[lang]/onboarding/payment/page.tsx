import { redirect } from "next/navigation";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { Locale } from "@/lib/i18n";
import { auth } from "@/auth";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { PaymentSetupClient } from "@/components/onboarding/payment-setup-client";

export default async function PaymentSetupPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);
  const session = await auth();

  if (!session?.accessToken) {
    redirect(`/${lang}/login`);
  }

  const status = await onboardingApi.getPaymentSetupStatus(session.accessToken);

  return (
    <PaymentSetupClient
      dict={dict.onboarding.paymentSetup}
      common={dict.common}
      lang={lang}
      initialStatus={status}
    />
  );
}
