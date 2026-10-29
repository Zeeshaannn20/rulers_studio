// The Rulers Studio "R" mark (vector traced from the official logo) and the name wordmark.
export const R_VIEWBOX = "0 0 109.9 100";
export const R_PATHS = [
  "M62.9 26.6L19.4 26.5L16.3 21.9C14.6 19.4 11.8 15.3 10.2 12.9C8.5 10.4 6.2 7.0 4.9 5.2C3.1 2.4 1.9 0.5 1.9 0.1C1.9 0.0 20.9 0.0 44.1 0.0L86.3 0.1L88.3 0.6C94.6 2.0 99.5 5.0 103.6 10.0C105.6 12.4 107.7 16.4 108.5 19.1C108.9 20.6 109.6 24.8 109.6 26.0L109.6 26.6L108.6 26.6C108.0 26.6 107.3 26.7 107.0 26.7C106.7 26.7 86.9 26.7 62.9 26.6Z", // top bar
  "M47.8 62.0L45.1 61.9L44.7 61.1C44.4 60.7 43.5 59.3 42.7 58.0C41.8 56.8 40.1 54.3 39.0 52.6C37.8 50.8 36.7 49.2 36.6 49.0C36.4 48.7 35.7 47.7 35.0 46.6C34.3 45.6 33.1 43.8 32.3 42.6C31.6 41.4 30.4 39.7 29.7 38.6C29.1 37.6 28.5 36.7 28.5 36.6C28.5 36.3 24.5 36.3 70.7 36.3C103.5 36.4 108.7 36.4 108.7 36.6C108.7 37.0 108.0 41.3 107.7 42.2C107.2 44.6 105.4 48.8 104.1 50.6C103.7 51.2 103.1 52.0 102.8 52.6C102.0 53.7 99.4 56.3 98.0 57.3C94.0 60.2 90.1 61.7 85.4 62.0C82.9 62.1 52.8 62.1 47.8 62.0Z", // middle bar
  "M75.7 97.6C72.3 97.1 68.8 94.8 66.6 91.5C65.9 90.5 63.1 86.4 61.8 84.4C60.2 82.0 59.5 81.0 59.0 80.0C58.6 79.4 57.7 78.0 56.9 76.8C56.1 75.6 55.0 74.0 54.5 73.3L53.6 71.9L69.1 71.9C89.4 71.8 90.4 71.9 92.6 73.6C94.5 75.0 95.0 75.7 102.2 86.3C102.7 86.9 103.4 88.0 103.9 88.8C104.4 89.5 105.2 90.6 105.5 91.1C105.9 91.7 107.0 93.3 107.9 94.7C108.8 96.1 109.6 97.3 109.7 97.5C109.9 97.8 109.1 97.8 93.3 97.8C84.2 97.7 76.2 97.7 75.7 97.6Z", // leg
  "M5.1 99.8C1.6 99.6 0.7 99.2 0.2 97.7C-0.3 95.9 0.0 94.3 2.9 86.2C3.8 83.5 5.5 78.5 6.6 75.2C15.6 48.4 15.9 47.5 17.0 46.9C17.6 46.5 17.6 46.5 18.1 46.9C19.2 47.7 19.1 47.5 29.9 79.4C30.5 81.3 31.3 83.5 31.6 84.3C31.9 85.1 32.4 86.8 32.9 88.1C33.3 89.3 33.8 91.0 34.1 91.9C35.2 94.9 35.4 95.9 35.2 96.7C34.9 97.7 33.9 99.3 33.4 99.4C31.8 99.8 30.1 99.9 19.3 99.9C12.8 99.9 6.4 99.9 5.1 99.8Z", // stem
];

// The four pieces as SVG paths (used where pieces animate separately, e.g. the intro build)
export function RSegments({ className }: { className?: string }) {
  return (
    <>
      {R_PATHS.map((d, i) => (
        <path key={i} className={className} d={d} />
      ))}
    </>
  );
}

// default fill: a sunlit gold gradient (champagne → gold → bronze)
export default function RMark({ className, fill }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox={R_VIEWBOX} aria-hidden="true">
      {!fill && (
        <defs>
          <linearGradient id="rs-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e5e5e5" />
            <stop offset="0.5" stopColor="#d8ff00" />
            <stop offset="1" stopColor="#b4d400" />
          </linearGradient>
        </defs>
      )}
      <g fill={fill || "url(#rs-gold)"}>
        <RSegments />
      </g>
    </svg>
  );
}

// The official logo tile: black R on a lime rounded square (header, menu, favicon)
export const LOGO_LIME = "#E0FE52";
export function RBadge({ className }: { className?: string }) {
  return (
    <svg className={"rbadge" + (className ? " " + className : "")} viewBox="0 0 120 120" aria-hidden="true">
      <rect width="120" height="120" rx="26" fill={LOGO_LIME} />
      <g fill="#0a0a0a" transform="translate(15 19) scale(0.82)">
        <RSegments />
      </g>
    </svg>
  );
}

// "Rulers Studio." set like the big name in the opening animation: one line of the italic serif, gold full stop
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={"wm" + (className ? " " + className : "")} aria-label="Rulers Studio">
      Rulers Studio
    </span>
  );
}
