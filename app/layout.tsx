import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Medics Online",
  description: "Online medical consultation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
