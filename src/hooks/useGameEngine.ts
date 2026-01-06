import { useState, useCallback, useRef, useEffect } from 'react';

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  colorIndex: number;
}

export type GameState = 'idle' | 'playing' | 'won' | 'lost';

interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
}

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_PADDING = 6;
const BRICK_TOP_OFFSET = 60;
const PADDLE_HEIGHT = 14;
const PADDLE_WIDTH_RATIO = 0.22;
const BALL_RADIUS = 10;
const BALL_SPEED = 5;

export const useGameEngine = (config: GameConfig) => {
  const { canvasWidth, canvasHeight } = config;
  
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  
  const ballRef = useRef<Ball>({
    x: canvasWidth / 2,
    y: canvasHeight - 80,
    dx: BALL_SPEED,
    dy: -BALL_SPEED,
    radius: BALL_RADIUS,
  });
  
  const paddleRef = useRef<Paddle>({
    x: canvasWidth / 2 - (canvasWidth * PADDLE_WIDTH_RATIO) / 2,
    y: canvasHeight - 40,
    width: canvasWidth * PADDLE_WIDTH_RATIO,
    height: PADDLE_HEIGHT,
  });
  
  const bricksRef = useRef<Brick[]>([]);
  
  const initBricks = useCallback(() => {
    const bricks: Brick[] = [];
    const brickWidth = (canvasWidth - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;
    const brickHeight = 22;
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * (brickWidth + BRICK_PADDING) + BRICK_PADDING,
          y: row * (brickHeight + BRICK_PADDING) + BRICK_TOP_OFFSET,
          width: brickWidth,
          height: brickHeight,
          visible: true,
          colorIndex: row % 5,
        });
      }
    }
    bricksRef.current = bricks;
  }, [canvasWidth]);
  
  const resetGame = useCallback(() => {
    ballRef.current = {
      x: canvasWidth / 2,
      y: canvasHeight - 80,
      dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      dy: -BALL_SPEED,
      radius: BALL_RADIUS,
    };
    
    paddleRef.current = {
      x: canvasWidth / 2 - (canvasWidth * PADDLE_WIDTH_RATIO) / 2,
      y: canvasHeight - 40,
      width: canvasWidth * PADDLE_WIDTH_RATIO,
      height: PADDLE_HEIGHT,
    };
    
    initBricks();
    setScore(0);
    setGameState('idle');
  }, [canvasWidth, canvasHeight, initBricks]);
  
  const startGame = useCallback(() => {
    if (gameState === 'idle') {
      setGameState('playing');
    }
  }, [gameState]);
  
  const movePaddle = useCallback((clientX: number, canvasRect: DOMRect) => {
    const relativeX = clientX - canvasRect.left;
    const paddle = paddleRef.current;
    const newX = relativeX - paddle.width / 2;
    paddle.x = Math.max(0, Math.min(canvasWidth - paddle.width, newX));
  }, [canvasWidth]);
  
  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const ball = ballRef.current;
    const paddle = paddleRef.current;
    const bricks = bricksRef.current;
    
    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collisions
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvasWidth) {
      ball.dx = -ball.dx;
      ball.x = Math.max(ball.radius, Math.min(canvasWidth - ball.radius, ball.x));
    }
    
    if (ball.y - ball.radius <= 0) {
      ball.dy = -ball.dy;
      ball.y = ball.radius;
    }
    
    // Ball fell below paddle
    if (ball.y + ball.radius >= canvasHeight) {
      setGameState('lost');
      return;
    }
    
    // Paddle collision
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      // Calculate reflection angle based on hit position
      const hitPos = (ball.x - paddle.x) / paddle.width;
      const angle = (hitPos - 0.5) * Math.PI * 0.7; // -70° to +70°
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      
      ball.dx = speed * Math.sin(angle);
      ball.dy = -Math.abs(speed * Math.cos(angle));
      ball.y = paddle.y - ball.radius;
    }
    
    // Brick collisions
    let allDestroyed = true;
    for (const brick of bricks) {
      if (!brick.visible) continue;
      allDestroyed = false;
      
      if (
        ball.x + ball.radius >= brick.x &&
        ball.x - ball.radius <= brick.x + brick.width &&
        ball.y + ball.radius >= brick.y &&
        ball.y - ball.radius <= brick.y + brick.height
      ) {
        brick.visible = false;
        setScore(prev => prev + 10);
        
        // Determine collision side
        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
        
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);
        
        if (minOverlapX < minOverlapY) {
          ball.dx = -ball.dx;
        } else {
          ball.dy = -ball.dy;
        }
        break;
      }
    }
    
    if (allDestroyed) {
      setGameState('won');
    }
  }, [gameState, canvasWidth, canvasHeight]);
  
  useEffect(() => {
    initBricks();
  }, [initBricks]);
  
  return {
    ball: ballRef.current,
    paddle: paddleRef.current,
    bricks: bricksRef.current,
    gameState,
    score,
    startGame,
    resetGame,
    movePaddle,
    updateGame,
  };
};
