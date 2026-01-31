import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "pro" | "success" | "warning" | "danger" | "info" | "gray" | "blue" | "green";
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_STYLES = {
  default: "bg-gray-100 text-gray-700",
  gray: "bg-gray-100 text-gray-700",
  pro: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  green: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  blue: "bg-blue-100 text-blue-700",
};

const SIZE_STYLES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  const variantClasses = VARIANT_STYLES[variant];
  const sizeClasses = SIZE_STYLES[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
}
