'use client';

/**
 * StickParkour — an animated SVG stick figure doing parkour.
 *
 * The figure is rendered as a <svg> with individually-animated limbs.
 * A wrapper <div> travels along a path (position keyframes) while the
 * figure's body rotates through parkour poses (flips, tucks, extensions).
 *
 * Drop this inside any container with `position:relative; overflow:hidden`.
 */

import './StickParkour.css';

export default function StickParkour() {
  return (
    <div className="parkour-stage" aria-hidden="true">
      {/* Shadow blob on the ground */}
      <div className="parkour-shadow" />

      {/* The figure wrapper travels the path; inner SVG handles pose */}
      <div className="parkour-figure">
        <svg
          className="parkour-svg"
          viewBox="0 0 50 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head */}
          <circle className="pk-head" cx="25" cy="10" r="7" />

          {/* Torso */}
          <line className="pk-torso" x1="25" y1="17" x2="25" y2="40" />

          {/* Left arm */}
          <line className="pk-arm pk-arm--l" x1="25" y1="22" x2="12" y2="32" />

          {/* Right arm */}
          <line className="pk-arm pk-arm--r" x1="25" y1="22" x2="38" y2="32" />

          {/* Left leg */}
          <line className="pk-leg pk-leg--l" x1="25" y1="40" x2="14" y2="60" />

          {/* Right leg */}
          <line className="pk-leg pk-leg--r" x1="25" y1="40" x2="36" y2="60" />
        </svg>
      </div>
    </div>
  );
}
