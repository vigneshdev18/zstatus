import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import NextTopLoader from "nextjs-toploader";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "ZStatus - Service Monitoring Platform",
  description:
    "Monitor your services, track incidents, and maintain reliability",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <NextTopLoader
            color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            height={3}
            showSpinner={false}
            speed={200}
            shadow="0 0 10px #667eea,0 0 5px #764ba2"
          />
          <Sidebar />
          <main className="ml-64 min-h-screen p-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
