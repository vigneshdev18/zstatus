"use client";

import { useState, ReactNode, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  className?: string;
  contentClassName?: string;
  position?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export default function Popover({
  trigger,
  children,
  isOpen,
  onToggle,
  onClose,
  className = "",
  contentClassName = "",
  position = "bottom",
  align = "center",
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [portalStyles, setPortalStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;

      // Calculate position and alignment based on trigger element
      switch (position) {
        case "top":
          top = triggerRect.top - 8; // 8px gap above
          // Horizontal alignment
          switch (align) {
            case "start":
              left = triggerRect.left;
              break;
            case "end":
              left = triggerRect.right;
              break;
            case "center":
            default:
              left = triggerRect.left + triggerRect.width / 2;
              break;
          }
          break;
        case "left":
          left = triggerRect.left - 8; // 8px gap to left
          // Vertical alignment
          switch (align) {
            case "start":
              top = triggerRect.top;
              break;
            case "end":
              top = triggerRect.bottom;
              break;
            case "center":
            default:
              top = triggerRect.top + triggerRect.height / 2;
              break;
          }
          break;
        case "right":
          left = triggerRect.right + 8; // 8px gap to right
          // Vertical alignment
          switch (align) {
            case "start":
              top = triggerRect.top;
              break;
            case "end":
              top = triggerRect.bottom;
              break;
            case "center":
            default:
              top = triggerRect.top + triggerRect.height / 2;
              break;
          }
          break;
        case "bottom":
        default:
          top = triggerRect.bottom + 8; // 8px gap below
          // Horizontal alignment
          switch (align) {
            case "start":
              left = triggerRect.left;
              break;
            case "end":
              left = triggerRect.right;
              break;
            case "center":
            default:
              left = triggerRect.left + triggerRect.width / 2;
              break;
          }
          break;
      }

      // Ensure popover stays within viewport bounds
      const popoverWidth = 384; // w-96 = 384px
      const popoverHeight = 400; // approximate height

      // Adjust position based on alignment and viewport bounds
      switch (position) {
        case "top":
        case "bottom":
          // For top/bottom, adjust horizontal position and potentially flip vertical
          if (align === "center") {
            // Center alignment: keep popover centered on trigger
            left -= popoverWidth / 2;
          } else if (align === "start") {
            // Start alignment: align popover left edge with trigger left edge
            // No adjustment needed
          } else if (align === "end") {
            // End alignment: align popover right edge with trigger right edge
            left -= popoverWidth;
          }

          // Check horizontal bounds
          if (left + popoverWidth > viewportWidth) {
            left = viewportWidth - popoverWidth - 16;
          }
          if (left < 16) {
            left = 16;
          }

          // Check vertical bounds - flip if needed
          if (position === "bottom" && top + popoverHeight > viewportHeight) {
            top = triggerRect.top - popoverHeight - 8;
          } else if (position === "top" && top < 16) {
            top = triggerRect.bottom + 8;
          }
          break;

        case "left":
        case "right":
          // For left/right, adjust vertical position and potentially flip horizontal
          if (align === "center") {
            // Center alignment: keep popover centered on trigger
            top -= popoverHeight / 2;
          } else if (align === "start") {
            // Start alignment: align popover top edge with trigger top edge
            // No adjustment needed
          } else if (align === "end") {
            // End alignment: align popover bottom edge with trigger bottom edge
            top -= popoverHeight;
          }

          // Check vertical bounds
          if (top + popoverHeight > viewportHeight) {
            top = viewportHeight - popoverHeight - 16;
          }
          if (top < 16) {
            top = 16;
          }

          // Check horizontal bounds - flip if needed
          if (position === "right" && left + popoverWidth > viewportWidth) {
            left = triggerRect.left - popoverWidth - 8;
          } else if (position === "left" && left < 16) {
            left = triggerRect.right + 8;
          }
          break;
      }

      setPortalStyles({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 50,
      });
    }
  }, [isOpen, position, align]);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <div ref={triggerRef} onClick={onToggle} className="cursor-pointer">
        {trigger}
      </div>

      {/* Portal Content */}
      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Content */}
            <div
              className={`w-96 glass rounded-xl border border-white/10 shadow-2xl ${contentClassName}`}
              style={portalStyles}
            >
              {children}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
