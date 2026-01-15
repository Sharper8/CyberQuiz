import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#05070b",
          borderRadius: 8,
          border: "1px solid rgba(34,211,238,0.75)",
          boxShadow: "0 0 10px rgba(34,211,238,0.25)",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#a3e635" />
            </linearGradient>
          </defs>
          <path
            d="M32 7.5c7.2 5.4 14.2 6.2 20.5 6.6v18.9c0 12.2-8.6 19.8-20.5 23.5C20.1 52.8 11.5 45.2 11.5 33V14.1C17.8 13.7 24.8 12.9 32 7.5Z"
            fill="none"
            stroke="url(#g)"
            strokeWidth="6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
