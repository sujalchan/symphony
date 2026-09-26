import "./SymphonyMark.css";

export default function SymphonyMark({ className = "" }: { className?: string }) {
  return (
    <svg className={`symphony-mark ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M50 50C40 40 32 28 21 28 10 28 4 37 4 50s7 22 17 22c12 0 20-13 29-22 9-9 17-22 29-22 11 0 17 9 17 22s-7 22-17 22c-12 0-20-12-29-22Z" />
    </svg>
  );
}
