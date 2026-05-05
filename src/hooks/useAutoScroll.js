import { useRef, useCallback, useEffect } from 'react';

export const useAutoScroll = () => {
  const scrollIntervalRef = useRef(null);
  const SCROLL_ZONE = 100;
  const SCROLL_SPEED = 12;

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleDragOverWindow = (e) => {
      const y = e.clientY;
      const h = window.innerHeight;
      stopAutoScroll();
      if (y < SCROLL_ZONE) {
        scrollIntervalRef.current = setInterval(() =>
          window.scrollBy({ top: -SCROLL_SPEED, behavior: 'instant' }), 16);
      } else if (y > h - SCROLL_ZONE) {
        scrollIntervalRef.current = setInterval(() =>
          window.scrollBy({ top: SCROLL_SPEED, behavior: 'instant' }), 16);
      }
    };

    window.addEventListener('dragover', handleDragOverWindow);
    window.addEventListener('dragend', stopAutoScroll);
    window.addEventListener('drop', stopAutoScroll);

    return () => {
      window.removeEventListener('dragover', handleDragOverWindow);
      window.removeEventListener('dragend', stopAutoScroll);
      window.removeEventListener('drop', stopAutoScroll);
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  return { stopAutoScroll };
};