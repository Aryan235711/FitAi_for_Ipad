import { useState, useRef, useEffect } from 'react';

interface ChartPoint {
  x: number;
  y: number;
  label?: string;
}

export function useChartInteractivity() {
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChartTouch = (e: React.TouchEvent, point: ChartPoint) => {
    e.preventDefault();
    const touch = e.touches[0];
    
    setActivePoint(point);
    setTooltipPos({
      x: touch.clientX,
      y: touch.clientY,
    });

    // Haptic on selection (if available)
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch (e) {
      // Haptic not supported
    }
  };

  const handleChartClick = (point: ChartPoint) => {
    setActivePoint(point);
  };

  const closeTooltip = () => {
    setActivePoint(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeTooltip();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchend', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    };
  }, []);

  return {
    containerRef,
    activePoint,
    tooltipPos,
    handleChartTouch,
    handleChartClick,
    closeTooltip,
  };
}
