import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-slate-200/50 dark:bg-slate-700/50 rounded-xl relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div 
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
        style={{ animationDuration: '2s', animationName: 'skeletonShimmer', animationIterationCount: 'infinite' }} 
      />
      <style>{`
        @keyframes skeletonShimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export { Skeleton };
