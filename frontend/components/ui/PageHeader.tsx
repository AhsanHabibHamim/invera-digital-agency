import Title from "@/components/ui/Title";
import type { PageBanner } from "@/types/cms";

interface PageHeaderProps {
  eyebrow?: string;
  title?: PageBanner["title"];
  description?: string;
  align?: "left" | "center";
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: PageHeaderProps) {
  return (
    <section className="relative z-2 overflow-hidden bg-background-alt">
      <div
        className={`container-premium pt-6xl pb-5xl ${
          align === "center" ? "text-center" : ""
        }`}
      >
        {eyebrow && <div className="eyebrow mb-md">{eyebrow}</div>}
        <h1 className="text-h1 text-balance">
          <Title segments={title} />
        </h1>
        {description && (
          <p
            className={`mt-md max-w-[42rem] text-body-large text-foreground/55 ${
              align === "center" ? "mx-auto" : ""
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
