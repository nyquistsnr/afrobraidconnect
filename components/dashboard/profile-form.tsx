"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { UserPublic, UserProfileUpdateRequest } from "@/lib/api/types";
import { usersApi } from "@/lib/api/users-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";

export function ProfileForm({
  user,
  logoUrl,
  dict,
  common,
  accessToken,
  lang,
}: {
  user: UserPublic;
  logoUrl: string | null;
  dict: Dictionary["dashboard"]["profile"] & { emailLabel?: string; roleLabel?: string };
  common: Dictionary["common"];
  accessToken: string;
  lang: Locale;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState<string | undefined>(user.phone_number || undefined);

  const updateMutation = useMutation({
    mutationFn: async (updates: UserProfileUpdateRequest) => {
      return usersApi.updateMe(accessToken, updates);
    },
    onSuccess: () => {
      toast.success(dict.successToast);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(getAuthErrorMessage(error.message, common.errors));
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    const formattedPhone = phone?.trim() || "";

    // The API uses `exclude_unset`, so we only send what might have changed.
    // If an optional field is empty, we send `null` to explicitly clear it.
    const updates: UserProfileUpdateRequest = {};

    if (firstName && firstName !== user.first_name) {
      updates.first_name = firstName;
    }

    if (lastName !== (user.last_name ?? "")) {
      updates.last_name = lastName || null;
    }

    if (formattedPhone !== (user.phone_number ?? "")) {
      updates.phone_number = formattedPhone || null;
    }

    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    } else {
      // Nothing changed
      toast.success(dict.successToast);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* Readonly Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-8">
        <div className="flex items-center gap-4">
          <Image
            src={logoUrl || "/images/profile.jpg"}
            alt={user.first_name}
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {user.first_name} {user.last_name}
              </h2>
              <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand ring-1 ring-inset ring-brand/20">
                {user.user_type}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Editable Section */}
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            label={dict.firstNameLabel}
            name="first_name"
            defaultValue={user.first_name}
            placeholder={dict.firstNamePlaceholder}
            required
          />
          <Input
            label={dict.lastNameLabel}
            name="last_name"
            defaultValue={user.last_name || ""}
            placeholder={dict.lastNamePlaceholder}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <PhoneInput
            label={dict.phoneLabel}
            lang={lang}
            value={phone}
            onChange={setPhone}
            placeholder="+1234567890"
          />
          <Input
            label={dict.emailLabel || "Email"}
            name="email"
            defaultValue={user.email}
            readOnly
            disabled
            className="opacity-70 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border mt-8">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="min-w-32"
        >
          {updateMutation.isPending ? common.loading : dict.saveButton}
        </Button>
      </div>
    </form>
  );
}
