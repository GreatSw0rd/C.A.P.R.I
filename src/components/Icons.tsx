import { useId, type SVGProps } from "react";

// Oeil de C.A.P.R.I (meme dessin que l'icone de l'appli : src-tauri/icons/icon-source.svg).
export const OeilCapriIcon = (props: SVGProps<SVGSVGElement>) => {
  const iris = `iris-${useId()}`;
  return (
    <svg viewBox="0 0 1024 1024" {...props}>
      <defs>
        <radialGradient id={iris} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#9C7BFF" />
          <stop offset="0.6" stopColor="#5B2BE0" />
          <stop offset="1" stopColor="#2A0F8F" />
        </radialGradient>
      </defs>
      <g transform="translate(512 512) scale(1.12) translate(-530 -510)">
        <path
          fill="#1E1830"
          stroke="#C4EAAA"
          strokeWidth="22"
          strokeLinejoin="round"
          d="M150 900C95 640 110 360 300 215C470 90 700 105 915 120L805 285C860 345 885 420 880 500L965 540L870 610C820 790 590 905 150 900Z"
        />
        <circle cx="500" cy="530" r="278" fill="#C4EAAA" />
        <circle cx="500" cy="530" r="252" fill="#1E1830" />
        <circle cx="500" cy="530" r="182" fill={`url(#${iris})`} />
        <circle cx="500" cy="530" r="104" fill="#F4F0FF" stroke="#1E1830" strokeWidth="16" />
      </g>
    </svg>
  );
};

export const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
  </svg>
);

export const GithubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    {...props}
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
  </svg>
);
