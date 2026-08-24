import type { TitleSegment } from "@/types/cms";

interface TitleProps {
  segments?: TitleSegment[] | string;
  className?: string;
}

function normalizeSegments(
  segments: TitleSegment[] | string | undefined,
): TitleSegment[] {
  if (!segments) return [];
  if (typeof segments === "string") {
    return segments.length > 0 ? [{ text: segments }] : [];
  }
  if (!Array.isArray(segments)) return [];
  return segments.filter(
    (seg): seg is TitleSegment =>
      !!seg && typeof seg === "object" && typeof seg.text === "string",
  );
}

/**
 * Renders CMS-driven title segments. `tone` maps to the design system accent
 * colors; `break` inserts a line break before the segment. Plain-string
 * titles (e.g. saved through the generic CMS editor) are rendered as-is.
 */
export default function Title({ segments, className }: TitleProps) {
  const segs = normalizeSegments(segments);
  if (segs.length === 0) return null;
  return (
    <span className={className}>
      {segs.map((seg, i) => (
        <span key={i}>
          {i > 0 && seg.break ? <br /> : null}
          {seg.tone === "primary" ? (
            <span className="text-primary">{seg.text}</span>
          ) : seg.tone === "accent" ? (
            <span className="text-accent">{seg.text}</span>
          ) : (
            seg.text
          )}
        </span>
      ))}
    </span>
  );
}
