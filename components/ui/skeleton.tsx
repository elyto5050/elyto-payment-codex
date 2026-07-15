export function Skeleton({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-zinc-800 rounded-md ${className}`} style={style} />;
}
