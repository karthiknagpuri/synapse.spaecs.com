import Image from "next/image";

export function SynapseLogo({
  className = "h-6 w-6",
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <Image
      src="/synapse-logo.png"
      alt="Synapse"
      width={200}
      height={200}
      className={className}
      style={{
        filter: dark ? "none" : "brightness(0)",
        objectFit: "contain",
      }}
    />
  );
}
