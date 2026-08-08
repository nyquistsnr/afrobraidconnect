"use client";

// @vis.gl/react-google-maps ships no "use client" directive in its built
// output, so importing APIProvider directly into a Server Component (the
// root layout) throws "createContext only works in Client Components".
// This thin wrapper carries the directive instead.
import { APIProvider } from "@vis.gl/react-google-maps";

export function GoogleMapsProvider({
  apiKey,
  children,
}: {
  apiKey: string;
  children: React.ReactNode;
}) {
  return <APIProvider apiKey={apiKey}>{children}</APIProvider>;
}
