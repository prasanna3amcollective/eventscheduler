import { useEffect, useRef } from 'react';

/**
 * EmptyState component – shows a friendly message when there is no data.
 * It displays a cluster of animated geometric shapes that drift around the
 * central text and subtly follow the user's mouse pointer, creating a playful,
 * intentional empty‑state experience.
 *
 * Usage:
 *   <EmptyState message="No upcoming activities" />
 */
export default function EmptyState({
  message = 'Nothing to display',
}: {
  message?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = container.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      container.style.setProperty('--mouse-x', `${x}%`);
      container.style.setProperty('--mouse-y', `${y}%`);
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="empty-state" ref={containerRef}>
      <div className="shapes">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`shape shape-${i + 1}`} />
        ))}
      </div>
      <p className="message">{message}</p>
    </div>
  );
}

/* ---------- Styles ---------- */
const style = `
.empty-state {
  --mouse-x: 50%;
  --mouse-y: 50%;
  position: relative;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px) saturate(150%);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.2);
}

.message {
  position: relative;
  z-index: 2;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary, #222);
  text-align: center;
  padding: 0 1rem;
}

.shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #ff6b6b, #ff9a44);
  opacity: 0.7;
  border-radius: 6px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
  animation: drift 6s infinite ease-in-out;
  transform: translate(var(--mouse-x, 50%), var(--mouse-y, 50%));
}

/* Individual shape offsets – give a scattered feel */
.shape-1 { top: 20%; left: 30%; }
.shape-2 { top: 10%; right: 25%; }
.shape-3 { bottom: 15%; left: 40%; }
.shape-4 { bottom: 25%; right: 20%; }
.shape-5 { top: 50%; left: 10%; }
.shape-6 { bottom: 40%; right: 10%; }

@keyframes drift {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  33% { transform: translate(-55%, -45%) rotate(15deg); }
  66% { transform: translate(-45%, -55%) rotate(-15deg); }
}
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = style;
  document.head.appendChild(styleTag);
}
