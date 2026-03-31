import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const imageSizes = {
  sm: "32px",
  md: "40px",
  lg: "56px",
  xl: "80px",
};

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden rounded-full bg-white", sizes[size], className)}>
        <Image src={src} alt={name} fill sizes={imageSizes[size]} className="object-cover" />
      </div>
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "gradient-brand flex items-center justify-center rounded-full font-semibold text-white",
        sizes[size],
        className,
      )}
    >
      {initials || "CS"}
    </div>
  );
}
