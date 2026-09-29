import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sahayak_font_scale';
const SCALES = ['normal', 'lg', 'xl'];

export function useFontScale() {
  const [scale, setScale] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'normal';
    }
    return 'normal';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, scale);
    document.documentElement.dataset.fs = scale === 'normal' ? '' : scale;
  }, [scale]);

  const cycleScale = () => {
    const currentIndex = SCALES.indexOf(scale);
    const nextIndex = (currentIndex + 1) % SCALES.length;
    setScale(SCALES[nextIndex]);
  };

  return { scale, setScale, cycleScale };
}