import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          backgroundColor: "#05070b",
          color: "#e6f0ff",
          position: "relative",
          overflow: "hidden",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        {/* grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(circle at 35% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        {/* glow blobs */}
        <div
          style={{
            position: "absolute",
            right: -200,
            top: -220,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at 30% 30%, rgba(163,230,53,0.35), rgba(163,230,53,0) 65%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -220,
            bottom: -260,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.35), rgba(34,211,238,0) 65%)",
          }}
        />

        {/* mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: 0.95,
            marginBottom: 26,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              border: "2px solid rgba(34,211,238,0.9)",
              boxShadow:
                "0 0 0 1px rgba(163,230,53,0.35), 0 0 24px rgba(34,211,238,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: "-0.5px",
            }}
          >
            CQ
          </div>
          <div style={{ fontSize: 22, color: "rgba(230,240,255,0.9)" }}>
            CyberQuiz
          </div>
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-1.5px",
            lineHeight: 1.05,
            marginBottom: 18,
            maxWidth: 940,
          }}
        >
          Teste tes connaissances en cybersécurité
        </div>

        <div
          style={{
            fontSize: 28,
            lineHeight: 1.3,
            color: "rgba(230,240,255,0.78)",
            maxWidth: 900,
          }}
        >
          Quiz interactif cybersécurité alimenté par l’IA
        </div>

        <div
          style={{
            position: "absolute",
            left: 72,
            bottom: 54,
            fontSize: 18,
            color: "rgba(230,240,255,0.6)",
          }}
        >
          cyberquiz
        </div>

        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 54,
            width: 260,
            height: 4,
            background:
              "linear-gradient(90deg, rgba(34,211,238,0.95), rgba(163,230,53,0.95))",
            borderRadius: 9999,
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.06), 0 0 24px rgba(34,211,238,0.18)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
