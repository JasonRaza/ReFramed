interface Props {
  width?: number;
  height?: number;
  className?: string;
}

export default function ReFramedLogo({ width = 200, height = 69, className }: Props) {
  return (
    <svg
      viewBox="0 0 320 110"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ReFramed"
    >
      {/* Top-left frame corner */}
      <polyline
        points="18,44 18,18 44,18"
        fill="none"
        stroke="#f6b73c"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-right frame corner */}
      <polyline
        points="302,66 302,92 276,92"
        fill="none"
        stroke="#f6b73c"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Text centered in the frame using textAnchor="middle" */}
      <text
        x="160"
        y="72"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="46"
        fontWeight="700"
      >
        <tspan fill="currentColor">Re</tspan>
        <tspan fill="#f6b73c">F</tspan>
        <tspan fill="currentColor">ramed</tspan>
      </text>
    </svg>
  );
}
