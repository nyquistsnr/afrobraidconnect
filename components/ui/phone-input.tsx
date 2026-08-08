"use client";

import RPNInput from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";
import fr from "react-phone-number-input/locale/fr";
import de from "react-phone-number-input/locale/de";
import "react-phone-number-input/style.css";
import { localeCountry, type Locale } from "@/lib/i18n";
import { CountrySelect } from "@/components/ui/country-select";

const localeLabels: Record<Locale, typeof en> = { en, fr, de };

export interface PhoneInputProps {
  id?: string;
  label: string;
  lang: Locale;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={!!error}
          disabled={disabled}
          countrySelectComponent={CountrySelect}
          countrySelectProps={{ searchPlaceholder, noResultsLabel }}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
