// File icon for HackPhone Files app (iOS 4 style)
// Source: Apple Files app icon (iOS 13+) for demo, replace with skeuomorphic if needed
import React from "react";

export default function HackPhoneFilesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 182 182"
      width={props.width || 64}
      height={props.height || 64}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="16" y="36" width="150" height="110" rx="18" fill="url(#paint0_linear)" />
      <rect x="16" y="36" width="150" height="110" rx="18" fill="url(#paint1_radial)" />
      <rect x="16" y="36" width="150" height="110" rx="18" fill="url(#paint2_radial)" />
      <rect x="16" y="36" width="150" height="110" rx="18" fill="url(#paint3_linear)" fillOpacity=".2" />
      <rect x="16" y="36" width="150" height="110" rx="18" stroke="#1A6FE2" strokeWidth="2" />
      <rect x="16" y="36" width="150" height="40" rx="10" fill="url(#paint4_linear)" />
      <defs>
        <linearGradient id="paint0_linear" x1="91" y1="36" x2="91" y2="146" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4FC3F7" />
          <stop offset="1" stopColor="#1976D2" />
        </linearGradient>
        <radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientTransform="matrix(0 55 -75 0 91 60)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="paint2_radial" cx="0" cy="0" r="1" gradientTransform="matrix(0 40 -60 0 91 120)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1976D2" stopOpacity=".2" />
          <stop offset="1" stopColor="#1976D2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="paint3_linear" x1="91" y1="36" x2="91" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="paint4_linear" x1="91" y1="36" x2="91" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".8" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
