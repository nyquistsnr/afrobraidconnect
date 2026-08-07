"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Building2, EyeOff, Mars, Upload, Venus, VenusAndMars, X } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { localeNames, type Locale } from "@/lib/i18n";
import type {
  BusinessInfoResponse,
  Gender,
  LogoContentType,
} from "@/lib/api/types";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { ApiError } from "@/lib/api/auth-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES: LogoContentType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

function otherLocalesOf(lang: Locale): Locale[] {
  return (["en", "fr", "de"] as Locale[]).filter((locale) => locale !== lang);
}

export function BusinessInfoForm({
  dict,
  common,
  lang,
  initialData,
}: {
  dict: Dictionary["onboarding"]["businessInfo"];
  common: Dictionary["common"];
  lang: Locale;
  initialData: BusinessInfoResponse;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const translationTitleId = useId();

  const [info, setInfo] = useState(initialData);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [businessName, setBusinessName] = useState(
    initialData.business_name ?? ""
  );
  const [gender, setGender] = useState<Gender | "">(initialData.gender ?? "");
  const [bio, setBio] = useState(initialData[`bio_${lang}`] ?? "");
  const [savedSnapshot, setSavedSnapshot] = useState({
    businessName: initialData.business_name ?? "",
    gender: initialData.gender ?? "",
    bio: initialData[`bio_${lang}`] ?? "",
  });
  // Resume polling if a previous save left a translation job mid-flight
  // (e.g. the user saved, then reloaded before it finished).
  const [polling, setPolling] = useState(() =>
    otherLocalesOf(lang).some(
      (locale) => initialData[`bio_${locale}_source`] === "PENDING"
    )
  );
  const [showTranslationModal, setShowTranslationModal] = useState(false);

  useEffect(() => {
    if (!polling || !session) return;
    let cancelled = false;
    let attempts = 0;

    async function tick() {
      if (cancelled) return;
      attempts += 1;
      try {
        const fresh = await onboardingApi.getBusinessInfo(
          session!.accessToken
        );
        if (cancelled) return;
        setInfo(fresh);
        const stillPending = otherLocalesOf(lang).some(
          (locale) => fresh[`bio_${locale}_source`] === "PENDING"
        );
        if (!stillPending) {
          setPolling(false);
          setShowTranslationModal(true);
          return;
        }
      } catch {
        // Best-effort — keep retrying until attempts run out.
      }
      if (cancelled) return;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        setPolling(false);
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    }

    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling]);

  const saveMutation = useMutation({
    mutationFn: () =>
      onboardingApi.updateBusinessInfo(
        session!.accessToken,
        {
          business_name: businessName.trim() || undefined,
          gender: gender || undefined,
          bio: bio.trim() || undefined,
        },
        lang
      ),
    onSuccess: (data) => {
      setInfo(data);
      setSavedSnapshot({
        businessName: businessName.trim(),
        gender,
        bio: bio.trim(),
      });
      toast.success(dict.toasts.saved);

      const nowPending = otherLocalesOf(lang).some(
        (locale) => data[`bio_${locale}_source`] === "PENDING"
      );
      if (nowPending) {
        setPolling(true);
      } else {
        router.push(`/${lang}/onboarding`);
      }
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const accessToken = session!.accessToken;
      const { upload_url, object_key } = await onboardingApi.getLogoUploadUrl(
        accessToken,
        { content_type: file.type as LogoContentType }
      );
      await onboardingApi.uploadLogoFile(upload_url, file);
      return onboardingApi.confirmLogo(accessToken, { object_key });
    },
    onSuccess: (data) => {
      setInfo(data);
      setLogoRemoved(false);
      toast.success(dict.toasts.logoUploaded);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type as LogoContentType)) {
      toast.error(getAuthErrorMessage("INVALID_LOGO_UPLOAD", common.errors));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error(getAuthErrorMessage("INVALID_LOGO_UPLOAD", common.errors));
      return;
    }

    logoMutation.mutate(file);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const current = {
      businessName: businessName.trim(),
      gender,
      bio: bio.trim(),
    };
    const unchanged =
      current.businessName === savedSnapshot.businessName &&
      current.gender === savedSnapshot.gender &&
      current.bio === savedSnapshot.bio;

    if (unchanged) {
      router.push(`/${lang}/onboarding`);
      return;
    }

    saveMutation.mutate();
  }

  function handleContinueFromModal() {
    setShowTranslationModal(false);
    router.push(`/${lang}/onboarding`);
  }

  function handleContinueWithoutWaiting() {
    setPolling(false);
    router.push(`/${lang}/onboarding`);
  }

  const showLogo = !!info.logo_url && !logoRemoved;
  const otherLocales = otherLocalesOf(lang);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {dict.logoLabel}
          </label>
          <div className="flex items-center gap-4">
            {showLogo ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={dict.logoChange}
                  className="block size-24 overflow-hidden rounded-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={info.logo_url ?? undefined}
                    alt=""
                    className="size-24 rounded-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setLogoRemoved(true)}
                  aria-label={dict.logoRemove}
                  className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoMutation.isPending}
                className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-full border border-dashed border-border bg-input px-2 text-center text-xs font-medium text-muted-foreground hover:border-brand hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="size-5" />
                {logoMutation.isPending ? common.loading : dict.logoUpload}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_LOGO_TYPES.join(",")}
              className="hidden"
              onChange={handleLogoChange}
            />

            <p className="text-xs text-muted-foreground">{dict.logoHelp}</p>
          </div>
        </div>

        <Input
          label={dict.businessNameLabel}
          showLabel
          name="businessName"
          icon={Building2}
          placeholder={dict.businessNamePlaceholder}
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          required
        />

        <Select<Gender>
          label={dict.genderLabel}
          showLabel
          value={gender}
          onChange={setGender}
          placeholder={dict.genderLabel}
          options={[
            { value: "FEMALE", label: dict.genderOptions.female, icon: Venus },
            { value: "MALE", label: dict.genderOptions.male, icon: Mars },
            {
              value: "OTHER",
              label: dict.genderOptions.other,
              icon: VenusAndMars,
            },
            {
              value: "PREFER_NOT_TO_SAY",
              label: dict.genderOptions.preferNotToSay,
              icon: EyeOff,
            },
          ]}
        />

        <div>
          <label
            htmlFor="bio"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {dict.bioLabel}
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder={dict.bioPlaceholder}
            maxLength={1000}
            rows={4}
            className="w-full border border-border bg-input px-4 py-3 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-brand"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={saveMutation.isPending || !businessName || !gender || !bio}
        >
          {saveMutation.isPending ? common.loading : dict.continue}
        </Button>

        {polling && (
          <p className="text-center text-xs text-muted-foreground">
            {dict.bioTranslatingNote}{" "}
            <button
              type="button"
              onClick={handleContinueWithoutWaiting}
              className="font-medium text-brand hover:text-brand-hover"
            >
              {dict.continueWithoutWaiting}
            </button>
          </p>
        )}
      </form>

      <Modal
        open={showTranslationModal}
        onClose={handleContinueFromModal}
        labelledBy={translationTitleId}
      >
        <h2
          id={translationTitleId}
          className="text-lg font-bold text-foreground"
        >
          {dict.translationModal.title}
        </h2>

        <div className="mt-4 space-y-4">
          {otherLocales.map((locale) => (
            <div key={locale}>
              <p className="text-sm font-semibold text-foreground">
                {localeNames[locale]}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {info[`bio_${locale}_source`] === "FAILED"
                  ? dict.translationModal.failed
                  : info[`bio_${locale}`]}
              </p>
            </div>
          ))}
        </div>

        <Button type="button" className="mt-6" onClick={handleContinueFromModal}>
          {dict.translationModal.continue}
        </Button>
      </Modal>
    </div>
  );
}
