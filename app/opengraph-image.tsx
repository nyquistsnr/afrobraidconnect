import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Afrobraid Connect";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/favicon_io/android-chrome-512x512.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #b9713f 0%, #7a4527 100%)",
        }}
      >
        <img
          src={logoSrc}
          width={220}
          height={220}
          style={{ borderRadius: 40 }}
        />
        <div
          style={{
            marginTop: 40,
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -1,
          }}
        >
          Afrobraid Connect
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 32,
            color: "#f5e2d3",
          }}
        >
          Connecting clients with professional hair braiders
        </div>
      </div>
    ),
    { ...size },
  );
}
