"use client";

import { useState, ReactNode } from "react";
import { HiChevronDown } from "react-icons/hi";

export interface DropdownOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface CustomDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  className?: string;
  menuClassName?: string;
  position?: "left" | "right";
}

export default function CustomDropdown({
  trigger,
  children,
  isOpen,
  onToggle,
  onClose,
  className = "",
  menuClassName = "",
  position = "right",
}: CustomDropdownProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <div onClick={onToggle} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={onClose} />

          {/* Menu */}
          <div
            className={`absolute mt-2 w-72 glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden max-h-96 ${
              position === "left" ? "left-0" : "right-0"
            } ${menuClassName}`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for dropdown triggers with chevron
interface DropdownTriggerProps {
  icon?: ReactNode;
  label: string;
  isOpen: boolean;
  className?: string;
}

export function DropdownTrigger({
  icon,
  label,
  isOpen,
  className = "",
}: DropdownTriggerProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-smooth text-white ${className}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      <HiChevronDown
        className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
      />
    </div>
  );
}
