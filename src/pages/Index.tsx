import { useState, useEffect } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';

const Index = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateDimensions = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 420);
      const maxHeight = Math.min(window.innerHeight - 120, 640);
      setDimensions({ width: maxWidth, height: maxHeight });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  if (dimensions.width === 0) return null;
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Breakout</h1>
        <p className="text-muted-foreground text-sm mt-1">经典打砖块游戏</p>
      </header>
      
      <main>
        <GameCanvas width={dimensions.width} height={dimensions.height} />
      </main>
      
      <footer className="mt-6 text-center text-muted-foreground text-xs">
        <p>触摸或鼠标移动控制挡板</p>
      </footer>
    </div>
  );
};

export default Index;
