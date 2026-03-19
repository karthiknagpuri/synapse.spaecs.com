"use client";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 160,
}: {
  segments: DonutSegment[];
  size?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={`Source breakdown: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
          {segments.map((segment) => {
            const segmentLength = (segment.value / total) * circumference;
            const currentOffset = offset;
            offset += segmentLength;

            return (
              <circle
                key={segment.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-currentOffset}
                transform={`rotate(-90 ${center} ${center})`}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-gray-900 tracking-tight">
            {total}
          </span>
          <span className="text-[11px] text-gray-500">Total</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-gray-600">{segment.label}</span>
            <span className="text-sm font-medium text-gray-900 tabular-nums">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
