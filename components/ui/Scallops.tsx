/** Row of six large half-circles — the shop-awning edge between light and dark sections. */
export default function Scallops({ bgColor = "bg-foreground", className = "" }: { bgColor?: string; className?: string }) {
  return (
    <div className={`h-fit w-full overflow-hidden flex items-center justify-center relative z-9 ${className}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`size-[calc(100vw/5.5)] rounded-full ${bgColor} shrink-0`} />
      ))}
    </div>
  );
}
