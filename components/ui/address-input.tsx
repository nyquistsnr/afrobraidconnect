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
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const places = useMapsLibrary("places");
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!places) return;
    setAutocompleteService(new places.AutocompleteService());
    const el = document.createElement("div");
    setPlacesService(new places.PlacesService(el));
  }, [places]);

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
    if (!autocompleteService || !inputValue.trim()) {
      setPredictions([]);
      return;
    }

    if (!open) return;

    const request: google.maps.places.AutocompletionRequest = {
      input: inputValue,
    };
    
    if (countryCode) {
      request.componentRestrictions = { country: countryCode.toLowerCase() };
    }

    autocompleteService.getPlacePredictions(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
      } else {
        setPredictions([]);
      }
    });
  }, [inputValue, autocompleteService, countryCode, open]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setOpen(true);
  }

  function handleSelect(prediction: google.maps.places.AutocompletePrediction) {
    if (!placesService) return;

    const selectedText = prediction.description;
    setInputValue(selectedText);
    setOpen(false);

    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["geometry", "name", "formatted_address", "address_components"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          if (!place.geometry || !place.geometry.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          let streetName = "";
          let streetNumber = "";
          let city = "";
          let postalCode = "";

          for (const component of place.address_components || []) {
            const types = component.types;
            if (types.includes("street_number")) {
              streetNumber = component.long_name;
            } else if (types.includes("route")) {
              streetName = component.long_name;
            } else if (
              types.includes("locality") ||
              types.includes("postal_town") ||
              types.includes("administrative_area_level_2")
            ) {
              if (!city) city = component.long_name;
            } else if (types.includes("postal_code") || types.includes("postal_code_prefix")) {
              postalCode = component.long_name;
            }
          }

          const line1 = `${streetName} ${streetNumber}`.trim();
          const finalLine1 = line1 || place.name || "";
          
          setInputValue(finalLine1);

          onAddressSelected({
            line1: finalLine1,
            city,
            postalCode,
            lat,
            lng,
          });
        }
      }
    );
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
          {predictions.map((p) => (
            <li key={p.place_id}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left transition-colors hover:bg-muted"
                onClick={() => handleSelect(p)}
              >
                <div className="text-sm font-medium text-foreground">
                  {p.structured_formatting.main_text}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {p.structured_formatting.secondary_text}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
