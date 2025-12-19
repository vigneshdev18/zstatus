"use client";

import { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 2 | 3 | 4 | 5 | 6 | 8;
  className?: string;
}

interface GridItemProps {
  children: ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | "full";
  className?: string;
}

/**
 * Grid Container Component
 *
 * @param cols - Maximum number of columns (1-6), defaults to 3
 * @param gap - Gap between grid items (2-8), defaults to 6
 * @param children - Grid items to render
 *
 * @example
 * <Grid cols={3} gap={6}>
 *   <GridItem>Content 1</GridItem>
 *   <GridItem colSpan={2}>Content 2 (spans 2 columns)</GridItem>
 * </Grid>
 */
export function Grid({
  children,
  cols = 3,
  gap = 6,
  className = "",
}: GridProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-3 lg:grid-cols-6",
  }[cols];

  const gapClass = {
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
    8: "gap-8",
  }[gap];

  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Grid Item Component
 *
 * @param colSpan - Number of columns this item should span (1-6 or "full")
 * @param children - Content to render
 *
 * @example
 * <GridItem colSpan={2}>This spans 2 columns</GridItem>
 * <GridItem colSpan="full">This spans all columns</GridItem>
 */
export function GridItem({ children, colSpan, className = "" }: GridItemProps) {
  const spanClass = colSpan
    ? {
        1: "col-span-1",
        2: "col-span-1 md:col-span-2",
        3: "col-span-1 md:col-span-2 lg:col-span-3",
        4: "col-span-1 md:col-span-2 lg:col-span-4",
        5: "col-span-1 md:col-span-2 lg:col-span-5",
        6: "col-span-1 md:col-span-3 lg:col-span-6",
        full: "col-span-full",
      }[colSpan]
    : "";

  return <div className={`${spanClass} ${className}`}>{children}</div>;
}
