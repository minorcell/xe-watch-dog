import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0d0d0d",
          color: "#ebebeb",
          fontFamily: "Geist, sans-serif",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", marginBottom: 40 }}>
          <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
            <ellipse cx="32" cy="34" rx="18" ry="16" fill="#d4a54a" />
            <ellipse cx="32" cy="26" rx="8" ry="5" fill="#e0b860" opacity="0.5" />
            <circle cx="22" cy="30" r="2.5" fill="#fff" />
            <circle cx="42" cy="30" r="2.5" fill="#fff" />
            <circle cx="22.5" cy="30" r="1.3" fill="#3a2a0a" />
            <circle cx="42.5" cy="30" r="1.3" fill="#3a2a0a" />
            <rect x="13" y="19" width="14" height="11" rx="4" fill="#2a2a2a" />
            <rect x="37" y="19" width="14" height="11" rx="4" fill="#2a2a2a" />
            <ellipse cx="20" cy="24.5" rx="4" ry="3.5" fill="#1a1a1a" />
            <ellipse cx="44" cy="24.5" rx="4" ry="3.5" fill="#1a1a1a" />
            <rect x="27" y="22" width="10" height="5" rx="2" fill="#333" />
            <ellipse cx="32" cy="44" rx="12" ry="7" fill="#e8c870" />
            <ellipse cx="32" cy="41" rx="5" ry="3.5" fill="#2a1a08" />
          </svg>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>Watchdog</div>
        <div style={{ fontSize: 24, color: "#8a8a8a", marginBottom: 8 }}>GitHub 组织数据分析平台</div>
        <div style={{ fontSize: 16, color: "#d4a54a", marginTop: 24 }}>Star 趋势监控 · 仓库管理 · 调度引擎</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
