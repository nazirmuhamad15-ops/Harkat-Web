// The root layout is required by Next.js but we delegate html/body to [locale]/layout.tsx
// This file acts as a pass-through for the locale layout.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
