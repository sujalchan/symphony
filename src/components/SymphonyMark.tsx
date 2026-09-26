import { useId } from "react";
import frostNoise from "../assets/frost-noise.svg";
import "./SymphonyMark.css";

export default function SymphonyMark({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const gradientId = `symphony-glass-${id}`;
  const maskId = `symphony-grain-mask-${id}`;
  const path = "M50 50C40 40 32 28 21 28 10 28 4 37 4 50s7 22 17 22c12 0 20-13 29-22 9-9 17-22 29-22 11 0 17 9 17 22s-7 22-17 22c-12 0-20-12-29-22Z";

  return (
    <svg className={`symphony-mark ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.96" />
          <stop offset="30%" stopColor="var(--accent)" stopOpacity="0.94" />
          <stop offset="75%" stopColor="var(--accent)" stopOpacity="0.76" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.9" />
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <path d={path} fill="none" stroke="white" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>
      <path className="symphony-mark-base" d={path} stroke={`url(#${gradientId})`} />
      <image className="symphony-mark-grain" href={frostNoise} x="0" y="0" width="100" height="100"
        preserveAspectRatio="xMidYMid slice" mask={`url(#${maskId})`} />
      <path className="symphony-mark-highlight" d={path} />
    </svg>
  );
}
