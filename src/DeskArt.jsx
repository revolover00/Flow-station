import React from "react";
// Original vector study: an isometric notebook, two covers, a pencil, and a focus dial.
export default function DeskArt() {
  return (
    <svg
      className="deskArt"
      viewBox="0 0 460 270"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="dot" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".8" fill="#406952" opacity=".25" />
        </pattern>
        <linearGradient id="paper" x2="1" y2="1">
          <stop stopColor="#ffffed" />
          <stop offset="1" stopColor="#e2e9c9" />
        </linearGradient>
        <linearGradient id="green" x2="0" y2="1">
          <stop stopColor="#6f8b58" />
          <stop offset="1" stopColor="#466b4c" />
        </linearGradient>
      </defs>
      <rect width="460" height="270" fill="url(#dot)" />
      <g stroke="#718e70" strokeWidth=".8" opacity=".75" strokeDasharray="3 5">
        <path d="m31 174 190 83 204-108M63 123l158-84 167 72M222 253v-20M108 80v30M392 160l28 11" />
        <circle cx="108" cy="78" r="3" />
      </g>
      <g stroke="#345548" strokeLinejoin="round" strokeWidth="1.5">
        <path d="m72 163 132-68 169 62-135 77z" fill="#7c9981" />
        <path d="m72 163 166 71v12l-166-71z" fill="#4d705e" />
        <path d="m238 234 135-77v12l-135 77z" fill="#a8bd9d" />
        <path d="m65 145 136-68 164 60-140 78z" fill="#a0b89a" />
        <path d="m65 145 160 70v12l-160-70z" fill="#d8dcc1" />
        <path d="m225 215 140-78v12l-140 78z" fill="#62806a" />
        <path d="m71 152 145 62M71 155l145 62" strokeWidth=".7" opacity=".55" />
        <path d="m72 128 126-66 166 59-135 80z" fill="#315f4d" />
        <path d="m72 128 157 73v8L72 137z" fill="#607e63" />
        <path d="m229 201 135-80v8l-135 80z" fill="#9db291" />
        <path
          d="m79 126 118-62q24 0 66 22l-113 68q-40-27-71-28Z"
          fill="url(#paper)"
        />
        <path
          d="m150 154 113-68q20-7 88 22l-123 84q-49-33-78-38Z"
          fill="#faf9df"
        />
        <path
          d="m79 126 0 5q34 2 71 29 34 5 78 38v-6q-45-34-78-38-38-26-71-28z"
          fill="#e2e5c8"
        />
        <path d="m228 192 123-84v6l-123 84z" fill="#dbe0c3" />
        <path d="m150 154 113-68" stroke="#95a889" />
        <path
          d="m240 105 9-5-104 66-8-3 2-3z"
          fill="#c17f5a"
          stroke="#88664d"
          strokeWidth=".9"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${108 + i * 11} ${119 - i * 5.9} q24 4 44 18 M${182 + i * 11} ${147 - i * 6.6} q17 4 45 20`}
            stroke="#94a58a"
            strokeWidth="1"
          />
        ))}
        <path d="m280 181 82-48 5 4-82 49-10 1z" fill="#dbb47a" />
        <path d="m275 187 5-6 5 5z" fill="#f4e2b7" />
        <path d="m361 133 5-3 5 4-4 3z" fill="#9b6852" />
      </g>
      <g
        transform="translate(76 44) rotate(-10 25 30)"
        stroke="#375b48"
        strokeWidth="1.7"
      >
        <path d="M25 4v-6h8v6" fill="#9bad80" />
        <circle cx="32" cy="30" r="27" fill="#80a384" />
        <circle cx="28" cy="29" r="25" fill="#edf1d8" />
        <circle cx="28" cy="29" r="21" stroke="#93a488" strokeDasharray="1 6" />
        <path d="M28 29V14m0 15 12 6" />
        <circle cx="28" cy="29" r="2" fill="#375b48" />
      </g>
      <g
        fill="#4e705a"
        fontFamily="monospace"
        fontSize="8"
        letterSpacing="1.4"
        direction="ltr"
      >
        <text x="37" y="220">
          FIG. 01
        </text>
        <text x="315" y="48">
          DESK STUDY
        </text>
      </g>
    </svg>
  );
}
