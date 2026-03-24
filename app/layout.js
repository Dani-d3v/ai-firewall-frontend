import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "AI Firewall",
  description: "Production-ready SaaS frontend for AI Firewall.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <AuthProvider>
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.3),_transparent_55%)]" />
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
