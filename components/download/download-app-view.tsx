"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Send, CheckCircle2, Apple, Play } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { contactApi } from "@/lib/api/contact-client";

export function DownloadAppView({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["downloadApp"];
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const waitlistSchema = z.object({
    email: z.string().email(),
  });

  type WaitlistValues = z.infer<typeof waitlistSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      reset({ email: session.user.email });
    }
  }, [status, session, reset]);

  const onSubmit = async (data: WaitlistValues) => {
    setSuccessMessage(null);
    setErrorMsg(null);

    const payload = {
      first_name: session?.user?.firstName || "App",
      last_name: session?.user?.lastName || "Waitlist",
      email: data.email,
      phone_number: session?.user?.phoneNumber || "+10000000000",
      purpose: "GENERAL" as const,
      subject: "App Waitlist",
      message: `User ${data.email} joined the app waitlist.`,
      platform: "CUSTOMER" as const,
    };

    try {
      const res = await contactApi.submit(payload, lang);
      if (res.status === "success") {
        setSuccessMessage(dict.successMessage);
      } else {
        setErrorMsg(res.error?.message || "Something went wrong.");
      }
    } catch (e) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-background px-6 py-20 lg:px-10">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-brand/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-[40%] -right-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="mb-6 inline-block rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-brand">
            {dict.subtitle}
          </span>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {dict.title}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {dict.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {/* App Store Button */}
          <button className="flex w-full max-w-[220px] items-center gap-3 rounded-2xl bg-black px-5 py-3 text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black">
            <Apple className="size-8" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-wider opacity-80">
                {dict.downloadOnAppStore?.split(" ")[0] || "Download on the"}
              </span>
              <span className="text-base font-semibold leading-tight">
                App Store
              </span>
            </div>
          </button>

          {/* Google Play Button */}
          <button className="flex w-full max-w-[220px] items-center gap-3 rounded-2xl bg-black px-5 py-3 text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black">
            <Play className="size-7" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-wider opacity-80">
                {dict.getItOnGooglePlay?.split(" ")[0] || "GET IT ON"}
              </span>
              <span className="text-base font-semibold leading-tight">
                Google Play
              </span>
            </div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="mx-auto max-w-lg"
        >
          {successMessage ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-10 shadow-lg"
            >
              <CheckCircle2 className="mb-4 size-14 text-green-500" />
              <h2 className="text-2xl font-bold text-foreground">
                {successMessage}
              </h2>
            </motion.div>
          ) : (
            <div className="rounded-3xl border border-border bg-surface p-8 shadow-xl">
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col items-start gap-2">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    {dict.emailLabel}
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder={dict.emailPlaceholder}
                    className="w-full rounded-2xl border border-border bg-background px-5 py-4 text-base text-foreground transition-all placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                  {errorMsg && (
                    <p className="text-sm text-red-500">{errorMsg}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 text-base font-bold text-brand-foreground shadow-md transition-all hover:bg-brand-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="size-5 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" />
                  ) : (
                    <>
                      {dict.notifyMe}
                      <Send className="size-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
