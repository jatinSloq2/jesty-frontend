import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Generates the browser tab icon from the same path data as JestyMark, kept
// in sync manually since ImageResponse can't import the SVG component
// directly. If the mark in jesty-mark.tsx changes, mirror the path here.
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ff7a00",
                }}
            >
                <svg width="22" height="22" viewBox="0 0 32 32">
                    <path
                        d="M16 4C9.373 4 4 8.86 4 14.86c0 3.24 1.58 6.15 4.09 8.14-.1 1.55-.62 3.02-1.55 4.28a.7.7 0 0 0 .74 1.1c2.1-.5 4.03-1.5 5.6-2.86 1.01.24 2.07.36 3.12.36 6.627 0 12-4.86 12-10.86S22.627 4 16 4Z"
                        fill="#ffffff"
                    />
                    <circle cx="11.3" cy="15.1" r="1.9" fill="#ff7a00" />
                    <circle cx="16.3" cy="15.1" r="1.9" fill="#ff7a00" />
                    <circle cx="21.3" cy="15.1" r="1.9" fill="#ff7a00" />
                </svg>
            </div>
        ),
        { ...size }
    );
}