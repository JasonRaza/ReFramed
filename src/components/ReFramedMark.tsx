interface Props {
  size?: number;
}

export default function ReFramedMark({ size = 30 }: Props) {
  return (
    <svg
      viewBox="0 0 44 44"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ReFramed"
    >
      {/* Top-left corner */}
      <polyline
        points="4,14 4,4 14,4"
        fill="none"
        stroke="#f6b73c"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-right corner */}
      <polyline
        points="40,30 40,40 30,40"
        fill="none"
        stroke="#f6b73c"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="7" y="30"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="22"
        fontWeight="700"
      >
        <tspan fill="currentColor">R</tspan>
        <tspan fill="#f6b73c">F</tspan>
      </text>
    </svg>
  );
}
