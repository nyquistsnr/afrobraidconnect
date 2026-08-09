const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export type ContactPlatform = "CUSTOMER" | "BRAIDER";
export type ContactPurpose = "GENERAL" | "PARTNER" | "PRICING" | "FAQS";

export interface ContactSubmissionRequest {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  subject?: string;
  message: string;
  platform: ContactPlatform;
  purpose?: ContactPurpose;
}

export interface ContactSubmissionResponse {
  id: string;
  message: string;
}

export interface APIResponse<T> {
  status: "success" | "error";
  status_label: string;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Array<{ loc: string[]; msg: string; type: string }>;
  } | null;
}

export const contactApi = {
  submit: async (
    data: ContactSubmissionRequest,
    lang: string = "en"
  ): Promise<APIResponse<ContactSubmissionResponse>> => {
    const res = await fetch(`${API_BASE}/contact?lang=${lang}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        subject: data.subject || undefined,
        purpose: data.purpose || undefined,
      }),
    });

    return res.json();
  },
};
