"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { usersApi } from "@/lib/api/users-client";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { ProfileDict } from "@/components/profile/types";

export function ProfileForm({
  dict,
  lang,
  accessToken,
}: {
  dict: ProfileDict;
  lang: Locale;
  accessToken: string;
}) {
  const queryClient = useQueryClient();
  const { update } = useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Track if we've initialized the form state from API data
  const [initialized, setInitialized] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const data = await usersApi.getMe(accessToken);
      if (!initialized) {
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setPhoneNumber(data.phone_number ?? "");
        setInitialized(true);
      }
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return usersApi.updateMe(accessToken, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone_number: phoneNumber || undefined,
      });
    },
    onSuccess: async (updatedProfile) => {
      queryClient.setQueryData(["profile"], updatedProfile);
      toast.success(dict.successMessage);
      
      // Update NextAuth session to reflect the new profile data immediately
      await update({
        firstName: updatedProfile.first_name,
        lastName: updatedProfile.last_name,
        phoneNumber: updatedProfile.phone_number,
      });
    },
    onError: () => {
      toast.error(dict.errorMessage);
    }
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  if (isLoading || !profile) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="firstName"
          label={dict.firstNameLabel}
          showLabel
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={mutation.isPending}
          required
        />
        <Input
          id="lastName"
          label={dict.lastNameLabel}
          showLabel
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={mutation.isPending}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="email"
          label={dict.emailLabel}
          showLabel
          value={profile.email}
          disabled
          className="bg-muted text-muted-foreground opacity-70"
        />
        <p className="text-xs text-muted-foreground">{dict.emailNote}</p>
      </div>

      <PhoneInput
        id="phoneNumber"
        label={dict.phoneLabel}
        lang={lang}
        value={phoneNumber}
        onChange={(val) => setPhoneNumber(val ?? "")}
        disabled={mutation.isPending}
      />

      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          disabled={mutation.isPending || (firstName === profile.first_name && lastName === profile.last_name && phoneNumber === (profile.phone_number ?? ""))}
        >
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {mutation.isPending ? dict.savingButton : dict.saveButton}
        </Button>
      </div>
    </form>
  );
}
