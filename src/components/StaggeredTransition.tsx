'use client';
import React, { useImperativeHandle, useRef, forwardRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';

export interface StaggeredTransitionRef {
  trigger: (customMidpoint?: () => void) => void;
  triggerBackwards: (customMidpoint?: () => void) => void;
  isBusy: () => boolean;
}

export function triggerStaggeredTransition(midpoint?: () => void) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('staggered-transition-trigger', {
        detail: { backwards: false, midpoint },
      })
    );
  }
}

export function triggerStaggeredTransitionBackwards(midpoint?: () => void) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('staggered-transition-trigger', {
        detail: { backwards: true, midpoint },
      })
    );
  }
}

export function isStaggeredTransitionBusy(): boolean {
  if (typeof window !== 'undefined') {
    return !!(window as any).__staggeredTransitionBusy;
  }
  return false;
}

interface StaggeredTransitionProps {
  onMidpoint?: () => void;
  colors?: string[];
}

const StaggeredTransition = forwardRef<StaggeredTransitionRef, StaggeredTransitionProps>(({
  onMidpoint,
  // 4 colors to create 4 cards
  colors = ['#0200F9', '#FFFFFF', '#C8A96E', '#080808']
}, ref) => {
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const setBusy = useCallback((busy: boolean) => {
    busyRef.current = busy;
    if (typeof window !== 'undefined') {
      (window as any).__staggeredTransitionBusy = busy;
    }
  }, []);

  const trigger = useCallback((customMidpoint?: () => void) => {
    if (busyRef.current) return;
    setBusy(true);
    setActive(true);

    setTimeout(() => {
      if (!containerRef.current) return;
      const layers = Array.from(containerRef.current.querySelectorAll('.st-card')) as HTMLDivElement[];

      // Set initial state: all cards offscreen to the right
      gsap.set(layers, { xPercent: 100 });

      const tl = gsap.timeline({
        onComplete: () => {
          setBusy(false);
          setActive(false);
        }
      });

      // 1. Enter: Cards slide in from Right to Center (0%)
      // The first color (bottom layer) slides in first, followed by the rest
      layers.forEach((el, i) => {
        tl.to(el, { xPercent: 0, duration: 0.6, ease: 'power4.out' }, i * 0.1);
      });

      // Midpoint: When the final (top) card completely covers the screen
      const midTime = 0.6 + (layers.length - 1) * 0.1;
      tl.call(() => {
        if (customMidpoint) {
          customMidpoint();
        } else if (onMidpoint) {
          onMidpoint();
        }
      }, [], midTime);

      // Brief pause while the screen is completely covered
      tl.to({}, { duration: 0.1 });

      // 2. Exit: Cards slide off from Center to Left (-100%)
      // By iterating in the original order, the final card (top layer) will be the last one to leave the screen.
      layers.forEach((el, i) => {
        tl.to(el, { xPercent: -100, duration: 0.6, ease: 'power4.inOut' }, midTime + 0.1 + i * 0.1);
      });

    }, 0);
  }, [onMidpoint, setBusy]);

  const triggerBackwards = useCallback((customMidpoint?: () => void) => {
    if (busyRef.current) return;
    setBusy(true);
    setActive(true);

    setTimeout(() => {
      if (!containerRef.current) return;
      const layers = Array.from(containerRef.current.querySelectorAll('.st-card')) as HTMLDivElement[];

      // Reverse z-index for backwards transition so the top card (4) becomes the bottom layer
      layers.forEach((el, i) => {
        el.style.zIndex = String(layers.length - i);
      });

      // Set initial state: all cards offscreen to the LEFT
      gsap.set(layers, { xPercent: -100 });

      const tl = gsap.timeline({
        onComplete: () => {
          // Reset z-index
          layers.forEach(el => {
            el.style.zIndex = '';
          });
          setBusy(false);
          setActive(false);
        }
      });

      const reversedLayers = layers.slice().reverse();

      // 1. Enter: Cards slide in from Left to Center (0%)
      reversedLayers.forEach((el, i) => {
        tl.to(el, { xPercent: 0, duration: 0.6, ease: 'power4.out' }, i * 0.1);
      });

      // Midpoint
      const midTime = 0.6 + (reversedLayers.length - 1) * 0.1;
      tl.call(() => {
        if (customMidpoint) {
          customMidpoint();
        } else if (onMidpoint) {
          onMidpoint();
        }
      }, [], midTime);

      tl.to({}, { duration: 0.1 });

      // 2. Exit: Cards slide off from Center to Right (100%)
      reversedLayers.forEach((el, i) => {
        tl.to(el, { xPercent: 100, duration: 0.6, ease: 'power4.inOut' }, midTime + 0.1 + i * 0.1);
      });

    }, 0);
  }, [onMidpoint, setBusy]);

  useImperativeHandle(ref, () => ({
    trigger,
    triggerBackwards,
    isBusy: () => busyRef.current,
  }), [trigger, triggerBackwards]);

  useEffect(() => {
    const handleCustomTrigger = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.backwards) {
        triggerBackwards(detail.midpoint);
      } else {
        trigger(detail.midpoint);
      }
    };
    window.addEventListener('staggered-transition-trigger', handleCustomTrigger);
    return () => window.removeEventListener('staggered-transition-trigger', handleCustomTrigger);
  }, [trigger, triggerBackwards]);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden z-[9999] pointer-events-none">
      <div ref={containerRef} className="relative w-full h-full pointer-events-none">
        {colors.map((c, i) => (
          <div
            key={i}
            className="st-card absolute top-0 left-0 h-full w-full"
            style={{
              background: c,
              zIndex: i + 1, // i=0 is bottom, i=3 is top
              willChange: 'transform'
            }}
          />
        ))}
      </div>
    </div>
  );
});

StaggeredTransition.displayName = 'StaggeredTransition';
export default StaggeredTransition;
