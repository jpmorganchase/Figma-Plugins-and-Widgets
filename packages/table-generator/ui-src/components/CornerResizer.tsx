import React, { PointerEventHandler, useState } from "react";

import "./CornerResizer.css";

/**
 * Helper to resize the Plugin window.
 */
export const CornerResizer = () => {
  const [isDragging, setIsDragging] = useState(false);
  const handlePointerDown: PointerEventHandler<SVGSVGElement> = (e) => {
    setIsDragging(true);
    (e.target as SVGSVGElement).setPointerCapture(e.pointerId);
  };
  const handlePointerUp: PointerEventHandler<SVGSVGElement> = (e) => {
    setIsDragging(false);
    (e.target as SVGSVGElement).releasePointerCapture(e.pointerId);
  };
  const resizeWindow: PointerEventHandler<SVGSVGElement> = (e) => {
    if (!isDragging) return;

    const size = {
      width: Math.max(50, Math.floor(e.clientX + 5)),
      height: Math.max(50, Math.floor(e.clientY + 5)),
    };
    parent.postMessage(
      {
        pluginMessage: {
          type: "resize-window",
          ...size,
        },
      },
      "*"
    );
  };

  return (
    <svg
      id="corner"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={resizeWindow}
    >
      <path
        d="M6.22577 16H3L16 3V6.22576L6.22577 16Z"
        className="corner-resizer-stroke"
      />
      <path
        d="M11.8602 16H8.63441L16 8.63441V11.8602L11.8602 16Z"
        className="corner-resizer-stroke"
      />
    </svg>
  );
};
