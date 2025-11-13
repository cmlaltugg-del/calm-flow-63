import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh,
  });

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = (pullDistance / threshold) * 360;

  return (
    <div className="relative">
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200"
        style={{
          height: `${pullDistance}px`,
          opacity: isPulling ? 1 : 0,
        }}
      >
        <div className="relative">
          <Loader2
            className="w-6 h-6 text-primary"
            style={{
              transform: isRefreshing
                ? "rotate(0deg)"
                : `rotate(${rotation}deg)`,
              transition: isRefreshing ? "none" : "transform 0.1s ease-out",
              animation: isRefreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          {!isRefreshing && (
            <div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              style={{
                clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`,
              }}
            />
          )}
        </div>
      </div>
      <div style={{ paddingTop: isPulling ? `${pullDistance}px` : "0" }}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
