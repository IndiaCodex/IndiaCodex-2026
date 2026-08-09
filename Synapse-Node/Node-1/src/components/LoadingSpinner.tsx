export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[3px]",
    lg: "w-8 h-8 border-4",
  };

  return (
    <div
      className={`${sizeMap[size]} border-black border-t-yellow-400 rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}
