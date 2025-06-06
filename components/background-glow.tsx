"use client"

export function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Main bottom right glow */}
      <div className="absolute -bottom-10 -right-10 w-[500px] h-[500px] bg-blue-500/15 dark:bg-blue-400/10 rounded-full blur-3xl" />
      
      {/* Secondary glow for depth */}
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-400/12 dark:bg-blue-500/8 rounded-full blur-2xl" />
      
      {/* Subtle accent glow */}
      <div className="absolute bottom-40 right-40 w-48 h-48 bg-blue-300/10 dark:bg-blue-300/6 rounded-full blur-xl" />
    </div>
  )
} 