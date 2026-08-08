"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input, type InputProps } from "@/components/ui/input";

export interface AddressInputProps extends Omit<InputProps, "onChange" | "value"> {
  countryCode: string | null;
  onAddressSelected: (address: {
    line1: string;
    city: string;
    postalCode: string;
    lat: number;
    lng: number;
  }) => void;
  defaultValue?: string;
}

export function AddressInput({ countryCode, onAddressSelected, defaultValue = "", ...props }: AddressInputProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!places || !inputValue.trim()) {
      setPredictions([]);
      return;
    }

    if (!open) return;

    let isActive = true;

    async function fetchPredictions() {
      const request: any = {
        input: inputValue,
      };
      
      if (countryCode) {
        request.includedRegionCodes = [countryCode.toLowerCase()];
      }

      try {
        const { suggestions } = await places!.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (isActive) {
          setPredictions(suggestions);
        }
      } catch (e) {
        if (isActive) setPredictions([]);
      }
    }
    
    fetchPredictions();

    return () => {
      isActive = false;
    };
  }, [inputValue, places, countryCode, open]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setOpen(true);
  }

  async function handleSelect(suggestion: any) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    const selectedText = prediction.text?.text ?? "";
    setInputValue(selectedText);
    setOpen(false);

    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["location", "displayName", "formattedAddress", "addressComponents"] });
      
      if (!place.location) return;

      const lat = place.location.lat();
      const lng = place.location.lng();

      let streetName = "";
      let streetNumber = "";
      let city = "";
      let postalCode = "";

      for (const component of place.addressComponents || []) {
        const types = component.types;
        if (types.includes("street_number")) {
          streetNumber = component.longText || "";
        } else if (types.includes("route")) {
          streetName = component.longText || "";
        } else if (
          types.includes("locality") ||
          types.includes("postal_town") ||
          types.includes("administrative_area_level_2")
        ) {
          if (!city) city = component.longText || "";
        } else if (types.includes("postal_code") || types.includes("postal_code_prefix")) {
          postalCode = component.longText || "";
        }
      }

      const line1 = `${streetName} ${streetNumber}`.trim();
      const finalLine1 = line1 || place.displayName || "";
      
      setInputValue(finalLine1);

      onAddressSelected({
        line1: finalLine1,
        city,
        postalCode,
        lat,
        lng,
      });
    } catch (e) {
      console.error("Error fetching place details:", e);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        {...props}
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
      />
      {open && predictions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface py-2 shadow-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {predictions.map((p: any) => {
            const prediction = p.placePrediction;
            if (!prediction) return null;
            return (
              <li key={prediction.placeId}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left transition-colors hover:bg-muted"
                  onClick={() => handleSelect(p)}
                >
                  <div className="text-sm font-medium text-foreground">
                    {prediction.mainText?.text}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {prediction.secondaryText?.text}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
