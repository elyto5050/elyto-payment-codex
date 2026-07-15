"use client";

// Temporarily disable framer-motion animations to avoid hiding content during debug
const motion = {
  div: ({ children, animate, transition, style, ...rest }: any) => {
    // preserve positioning/style but drop animation props
    return <div style={style} {...rest}>{children}</div>;
  }
};

const blocks = [
  { x: "10%", y: "20%", size: 80, delay: 0 },
  { x: "70%", y: "15%", size: 120, delay: 0.2 },
  { x: "85%", y: "60%", size: 60, delay: 0.4 },
  { x: "25%", y: "70%", size: 100, delay: 0.6 }
];

export function HeroBlocks() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {blocks.map((block, i) => (
        <motion.div
          key={i}
          className="absolute rounded-2xl border border-border/60 bg-gradient-to-br from-primary/20 to-secondary/10 backdrop-blur-sm"
          style={{ left: block.x, top: block.y, width: block.size, height: block.size }}
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: block.delay }}
        />
      ))}
    </div>
  );
}
