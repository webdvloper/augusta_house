import type { SVGProps } from "react";

const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  catalog: "M4 6h16M4 12h10M4 18h7m6-3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm2.2 5.2L21 21.5",
  cart: "M5 8h14l-1.2 11a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Zm3.5 0V6.5a3.5 3.5 0 0 1 7 0V8",
  heart:
    "M12 20.5S3.5 15.4 3.5 9.3A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 8.5 1.7c0 6.1-8.5 11.2-8.5 11.2Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8.5a7.5 7.5 0 0 1 15 0",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm5-1.5L20 20",
  phone:
    "M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z",
  pin: "M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  chevron: "m9 5 7 7-7 7",
  check: "m5 12.5 4.5 4.5L19 7.5",
  trash: "M4 7h16M9 7V4.5h6V7m-8.5 0 .8 12.5h9.400L17.5 7M10 11v5.5m4-5.5v5.5",
  truck:
    "M3 6.5h11v9.5H3V6.5Zm11 3h4l3 3.5v3h-7v-6.5ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10.5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  leaf: "M5 19c0-8 5-13 15-14-1 10-6 15-14 14Zm0 0 7-7",
  ruler: "m3.5 16.5 13-13 4 4-13 13-4-4Zm4-4 1.5 1.5m1.5-4.5 1.5 1.5m1.5-4.5 1.5 1.5",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  close: "M6 6l12 12M18 6 6 18",
  tag: "M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8-9.1 9.1-8-8Zm4.5-4.1h.01",
  arrow: "M4 12h15m-5-6 6 6-6 6",
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  filled?: boolean;
}

export function Icon({ name, filled = false, className = "size-5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
