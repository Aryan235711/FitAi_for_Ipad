import { useRef, useEffect, useState } from 'react';

interface UsePinchZoomOptions {
  onZoom?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
  enabled?: boolean;
}

export function usePinchZoom({
  onZoom,
  minScale = 1,
  maxScale = 3,
  enabled = true,
}: UsePinchZoomOptions) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistanceRef.current = getDistance(e.touches);
        initialScaleRef.current = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || initialDistanceRef.current === 0) return;

      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialDistanceRef.current;
      const newScale = Math.min(
        Math.max(initialScaleRef.current * scaleChange, minScale),
        maxScale
      );

      setScale(newScale);
      onZoom?.(newScale);
    };

    const handleTouchEnd = () => {
      initialDistanceRef.current = 0;
      initialScaleRef.current = 1;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, scale, minScale, maxScale, onZoom]);

  return {
    containerRef,
    scale,
    resetScale: () => setScale(1),
  };
}
