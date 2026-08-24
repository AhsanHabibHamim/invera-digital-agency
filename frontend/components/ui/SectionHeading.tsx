interface SectionHeadingProps {
  index: string;
  label: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function SectionHeading({
  index,
  label,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={`${align === "center" ? "mx-auto text-center" : ""}`}
    >
      {/* Section Label */}

      <span className="eyebrow">
        ({index}) — {label}
      </span>

      {/* Heading */}

      <h2 className="text-h2 mt-sm text-balance">{title}</h2>

      {/* Description */}

      {description && (
        <p className="text-section-desc mt-md">{description}</p>
      )}
    </div>
  );
}
