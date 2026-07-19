import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "XCars — Votre agence de location en ligne",
    template: "%s | XCars",
  },
  description:
    "Gérez votre flotte, vos réservations et votre site de location depuis une plateforme unique.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "XCars",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
