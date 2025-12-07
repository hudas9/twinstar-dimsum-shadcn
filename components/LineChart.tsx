"use client";
import React from "react";

type Props = {
  labels: string[];
  data: number[];
  height?: number;
  color?: string;
};

export default function LineChart({
  labels,
  data,
  height = 80,
  color = "#2563eb",
}: Props) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-zinc-500">No data</div>;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  });

  const path = points.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(" ");

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <div>{labels[0]}</div>
        <div>{labels[labels.length - 1]}</div>
      </div>
    </div>
  );
}
