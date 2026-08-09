"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, CheckCircle2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { contactApi, type ContactPurpose } from "@/lib/api/contact-client";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";

export function ContactView({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["contactUs"];
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const contactSchema = z.object({
    first_name: z.string().min(1, { message: dict.firstNameLabel }),
    last_name: z.string().min(1, { message: dict.lastNameLabel }),
    email: z.string().email(),
    phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/, { message: dict.phoneLabel }),
    subject: z.string().optional(),
    purpose: z.enum(["GENERAL", "PARTNER", "PRICING", "FAQS"]).optional(),
    message: z.string().min(1, { message: dict.messageLabel }).max(5000),
  });

  type ContactFormValues = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      purpose: "GENERAL",
    },
  });

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      reset({
        first_name: session.user.firstName || "",
        last_name: session.user.lastName || "",
        email: session.user.email || "",
        phone_number: session.user.phoneNumber || "",
        purpose: "GENERAL",
      });
    }
  }, [status, session, reset]);

  const onSubmit = async (data: ContactFormValues) => {
    setSuccessMessage(null);
    setRateLimitSeconds(null);

    try {
      const res = await contactApi.submit(
        {
          ...data,
          platform: "CUSTOMER",
        },
        lang
      );

      if (res.status === "success" && res.data) {
        setSuccessMessage(res.data.message);
        reset();
      } else if (res.error) {
        if (res.error.code === "RATE_LIMITED") {
          // Fallback timer if header isn't exposed properly, standard is 3600
          setRateLimitSeconds(3600);
        } else if (res.error.code === "VALIDATION_ERROR" && res.error.details) {
          res.error.details.forEach((err) => {
            const field = err.loc[err.loc.length - 1] as keyof ContactFormValues;
            if (field) {
              setError(field, { type: "server", message: err.msg });
            }
          });
        } else {
          setError("root", { type: "server", message: res.error.message });
        }
      }
    } catch (e) {
      setError("root", { type: "server", message: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <section className="bg-surface px-6 py-20 text-center sm:py-32 lg:px-10">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {dict.title}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {dict.subtitle}
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          {successMessage ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-12 text-center shadow-sm">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <CheckCircle2 className="size-10" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-foreground">
                {dict.successTitle}
              </h2>
              <p className="text-lg text-muted-foreground">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="mt-8 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-10">
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="first_name" className="text-sm font-medium text-foreground">
                      {dict.firstNameLabel} *
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      {...register("first_name")}
                      placeholder={dict.firstNamePlaceholder}
                      className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-500">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="last_name" className="text-sm font-medium text-foreground">
                      {dict.lastNameLabel} *
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      {...register("last_name")}
                      placeholder={dict.lastNamePlaceholder}
                      className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-500">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    {dict.emailLabel} *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder={dict.emailPlaceholder}
                    className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    {dict.phoneLabel} *
                  </label>
                  <Controller
                    name="phone_number"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        id="phone_number"
                        label={dict.phoneLabel}
                        lang={lang}
                        value={field.value || ""}
                        onChange={field.onChange}
                        error={errors.phone_number?.message}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Controller
                      name="purpose"
                      control={control}
                      render={({ field }) => (
                        <Select
                          id="purpose"
                          label={dict.purposeLabel}
                          showLabel={true}
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={[
                            { value: "GENERAL", label: dict.purposes.GENERAL },
                            { value: "PARTNER", label: dict.purposes.PARTNER },
                            { value: "PRICING", label: dict.purposes.PRICING },
                            { value: "FAQS", label: dict.purposes.FAQS },
                          ]}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="subject" className="text-sm font-medium text-foreground">
                      {dict.subjectLabel}
                    </label>
                    <input
                      id="subject"
                      type="text"
                      {...register("subject")}
                      placeholder={dict.subjectPlaceholder}
                      className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">
                    {dict.messageLabel} *
                  </label>
                  <textarea
                    id="message"
                    {...register("message")}
                    placeholder={dict.messagePlaceholder}
                    rows={6}
                    className="resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500">{errors.message.message}</p>
                  )}
                </div>

                {errors.root && (
                  <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
                    {errors.root.message}
                  </div>
                )}

                {rateLimitSeconds != null && (
                  <div className="rounded-xl bg-yellow-500/10 p-4 text-sm text-yellow-600 dark:text-yellow-500">
                    {dict.rateLimited} {dict.retryAfter.replace("{seconds}", rateLimitSeconds.toString())}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || rateLimitSeconds != null}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? dict.submitting : (
                    <>
                      <Send className="size-5" />
                      {dict.submit}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
