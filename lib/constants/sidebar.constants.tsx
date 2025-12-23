import {
  HiChartBar,
  HiCog,
  HiExclamation,
  HiFolder,
  HiServer,
  HiUser,
  HiViewGrid,
} from "react-icons/hi";

export const navigationSections = [
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
        name: "Users",
        href: "/config/users",
        icon: <HiUser className="w-5 h-5" />,
        adminOnly: true, // Only show to admins
      },
      {
        name: "Settings",
        href: "/settings",
        icon: <HiCog className="w-5 h-5" />,
      },
    ],
  },
];
