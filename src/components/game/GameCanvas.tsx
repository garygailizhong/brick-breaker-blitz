import React, { useRef, useEffect, useCallback } from 'react';
import { useGameEngine, GameState } from '@/hooks/useGameEngine';

const BRICK_COLORS = [
  'hsl(230, 80%, 60%)',  // Blue
  'hsl(180, 70%, 50%)',  // Cyan
  'hsl(280, 70%, 60%)',  // Purple
  'hsl(30, 90%, 55%)',   // Orange
  'hsl(340, 80%, 60%)',  // Pink
];

interface GameCanvasProps {
  width: number;
  height: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const {
    ball,
    paddle,
    bricks,
    gameState,
    score,
    startGame,
    resetGame,
    movePaddle,
    updateGame,
  } = useGameEngine({ canvasWidth: width, canvasHeight: height });
  
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = 'hsl(220, 25%, 12%)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw bricks
    for (const brick of bricks) {
      if (!brick.visible) continue;
      
      ctx.fillStyle = BRICK_COLORS[brick.colorIndex];
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 6);
      ctx.fill();
      
      // Subtle highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height / 2, [6, 6, 0, 0]);
      ctx.fill();
    }
    
    // Draw paddle with glow
    ctx.shadowColor = 'hsl(230, 80%, 60%)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'hsl(0, 0%, 100%)';
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw ball with glow
    ctx.shadowColor = 'hsl(0, 0%, 100%)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'hsl(0, 0%, 100%)';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw score
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 16, 32);
  }, [width, height, ball, paddle, bricks, score]);
  
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    updateGame();
    draw(ctx);
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, draw]);
  
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);
  
  const handleInteraction = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    movePaddle(clientX, rect);
    
    if (gameState === 'idle') {
      startGame();
    }
  }, [movePaddle, startGame, gameState]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    handleInteraction(e.clientX);
  }, [handleInteraction]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      handleInteraction(e.touches[0].clientX);
    }
  }, [handleInteraction]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      handleInteraction(e.touches[0].clientX);
    }
  }, [handleInteraction]);
  
  return (
    <div className="relative game-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-2xl shadow-2xl"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onClick={() => gameState === 'idle' && startGame()}
      />
      
      {/* Overlay for game states */}
      {(gameState === 'idle' || gameState === 'won' || gameState === 'lost') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm">
          {gameState === 'idle' && (
            <>
              <h2 className="text-3xl font-bold text-white mb-2">打砖块</h2>
              <p className="text-white/80 text-lg mb-6">滑动或移动鼠标开始游戏</p>
            </>
          )}
          
          {gameState === 'won' && (
            <>
              <h2 className="text-3xl font-bold text-green-400 mb-2">🎉 胜利!</h2>
              <p className="text-white/80 text-xl mb-2">最终得分: {score}</p>
            </>
          )}
          
          {gameState === 'lost' && (
            <>
              <h2 className="text-3xl font-bold text-red-400 mb-2">游戏结束</h2>
              <p className="text-white/80 text-xl mb-2">得分: {score}</p>
            </>
          )}
          
          {(gameState === 'won' || gameState === 'lost') && (
            <button
              onClick={resetGame}
              className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity active:scale-95"
            >
              重新开始
            </button>
          )}
        </div>
      )}
    </div>
  );
};
