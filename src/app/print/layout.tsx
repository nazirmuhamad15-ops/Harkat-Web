import { Noto_Sans } from "next/font/google";
import "../globals.css"; 

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-noto-sans",
  display: 'swap',
});

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen bg-stone-100 ${notoSans.variable} font-sans`}>
      {children}
    </div>
  )
}
