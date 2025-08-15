import { useEffect, useState } from 'react';

const CursorGlow = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-50 transition-opacity duration-300"
      style={{
        transform: `translate(${mousePosition.x - 50}px, ${mousePosition.y - 50}px)`,
      }}
    >
      {/* Main glow */}
      <div className="w-24 h-24 rounded-full bg-primary/20 blur-xl animate-pulse" />
      
      {/* Inner glow */}
      <div 
        className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.3) 50%, transparent 100%)',
          boxShadow: '0 0 20px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.2)',
        }}
      />
      
      {/* Core */}
      <div 
        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'hsl(var(--primary))',
          boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))',
        }}
      />
    </div>
  );
};

export default CursorGlow;