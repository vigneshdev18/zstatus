"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HiViewGrid,
  HiServer,
  HiExclamation,
  HiChartBar,
  HiFolder,
  HiCog,
} from "react-icons/hi";

const navigationSections = [
  {
    title: "Monitoring",
    items: [
      {
        name: "Overview",
        href: "/overview",
        icon: <HiViewGrid className="w-5 h-5" />,
      },
      {
        name: "Services",
        href: "/services",
        icon: <HiServer className="w-5 h-5" />,
      },
      {
        name: "Incidents",
        href: "/incidents",
        icon: <HiExclamation className="w-5 h-5" />,
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: <HiChartBar className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        name: "Groups",
        href: "/groups",
        icon: <HiFolder className="w-5 h-5" />,
      },
      {
        name: "Settings",
        href: "/settings",
        icon: <HiCog className="w-5 h-5" />,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-[var(--color-border)] flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <Link href="/overview" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">Z</span>
          </div>
          <span className="text-xl font-bold gradient-text">ZStatus</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth
                      ${
                        isActive
                          ? "bg-gradient-primary text-white shadow-gradient"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Status Indicator */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-[var(--color-status-up)] rounded-full"></div>
              <div className="absolute inset-0 w-2 h-2 bg-[var(--color-status-up)] rounded-full status-pulse"></div>
            </div>
            <div>
              <p className="text-xs text-gray-400">System Status</p>
              <p className="text-sm font-medium text-white">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
