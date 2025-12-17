export default function Loading({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 rounded-full border-4 border-white/10"></div>
          {/* Animated ring */}
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-500 animate-spin"></div>
          {/* Inner glow */}
          <div className="absolute inset-2 w-12 h-12 rounded-full bg-gradient-primary opacity-20 blur-lg"></div>
        </div>

        {/* Loading text */}
        <p className="text-gray-400 text-sm animate-pulse">{message}</p>
      </div>
    </div>
  );
}
