"use client";

import { usePathname } from "next/navigation";
import { ReactElement, cloneElement } from "react";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that should not show sidebar
  const noSidebarPages = ["/login"];
  const showSidebar = !noSidebarPages.includes(pathname);

  // Extract sidebar and page content from children
  const childrenArray = Array.isArray(children) ? children : [children];
  const sidebar = childrenArray[0];
  const pageContent = childrenArray[1];

  if (!showSidebar) {
    // Login page - no sidebar, no margin, no main wrapper
    return <>{pageContent}</>;
  }

  // Regular pages - with sidebar and margin
  return (
    <>
      {sidebar}
      <main className="ml-64 min-h-screen p-8">{pageContent}</main>
    </>
  );
}
