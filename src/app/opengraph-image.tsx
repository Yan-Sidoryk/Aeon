import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { AEON_LOGO_PATHS } from "@/components/AeonLogo";

export const alt = "Aeon: see how AI actually talks about your pharma brand";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hand-drawn swoosh from the hero (same path as UnderlineSwoosh in icons.tsx).
const SWOOSH =
  "M280.02 7.95265C234.021 10.9089 187.176 14.3952 140.289 16.7601C96.4998 18.962 52.6482 19.9814 8.81726 21.5105C8.13595 21.5309 7.434 21.5105 6.75268 21.5105C3.44936 21.5512 0.063418 21.1639 0.00148073 17.0659C-0.0811023 12.9069 3.30483 12.5399 6.60815 12.4991C18.8098 12.3768 31.0527 12.601 43.2337 11.9894C92.8661 9.54288 142.54 7.42256 192.131 4.05859C256.071 -0.283999 319.949 -1.62959 383.93 2.44795C387.337 2.67222 390.495 3.32462 390.124 7.46333C389.752 11.602 386.346 11.5613 383.063 11.4389C349.039 10.2768 314.994 9.13512 280.02 7.97302V7.95265Z";

export default async function OpengraphImage() {
  const root = process.cwd();
  const [geist, nanum, doodle] = await Promise.all([
    readFile(join(root, "assets-src/fonts/Geist.ttf")),
    readFile(join(root, "assets-src/fonts/Nanum-Pen-Script-og.ttf")),
    readFile(join(root, "public/images/doodles/doodle-track.png")),
  ]);
  const doodleSrc = `data:image/png;base64,${doodle.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f1f0ec",
          padding: "64px 72px",
          fontFamily: "Geist",
          color: "#000",
          position: "relative",
        }}
      >
        <svg width="200" height="55" viewBox={AEON_LOGO_PATHS.viewBox.full} fill="none">
          <path fill="#000" fillRule="evenodd" d={AEON_LOGO_PATHS.ring} />
          {AEON_LOGO_PATHS.word.map((d) => (
            <path key={d.slice(0, 16)} fill="#000" fillRule="evenodd" d={d} />
          ))}
          <path fill="#4570FF" d={AEON_LOGO_PATHS.dot} />
        </svg>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Nanum Pen Script", fontSize: 44, lineHeight: 1, marginBottom: 14 }}>
            More than rank tracking
          </div>
          <div style={{ fontSize: 78, lineHeight: 0.95, letterSpacing: -2.6, fontWeight: 500 }}>
            See how AI actually talks
          </div>
          <div style={{ display: "flex", fontSize: 78, lineHeight: 0.95, letterSpacing: -2.6, fontWeight: 500 }}>
            about your&nbsp;
            <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
              <span>pharma brand</span>
              <svg width="100%" height="18" viewBox="0 0 391 22" preserveAspectRatio="none" style={{ marginTop: 6 }}>
                <path fill="#FF6808" d={SWOOSH} />
              </svg>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#6e6d6c", letterSpacing: -0.4 }}>
          AI visibility, label accuracy and pre-MLR review for pharma brands
        </div>

        <img
          src={doodleSrc}
          width={180}
          height={180}
          alt=""
          style={{ position: "absolute", right: 64, top: 44, transform: "rotate(-6deg)" }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: geist, style: "normal", weight: 500 },
        { name: "Nanum Pen Script", data: nanum, style: "normal", weight: 400 },
      ],
    },
  );
}
