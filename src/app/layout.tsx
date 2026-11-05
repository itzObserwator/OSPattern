import type { Metadata } from "next";
import localFont from "next/font/local";
import { demoService } from "@/lib/demo-service";
import { AppShell } from "@/components/business/app-shell";
import { WorkspaceProvider } from "@/components/business/workspace-provider";
import "./globals.css";
import "./spatial.css";
import "./components.css";
import "./executive.css";
import "./techgy-brand.css";
import "./showcases.css";
import "./employee-profile.css";
import "./overview-summaries.css";
import "./finance-workspace.css";
import "./module-workspaces.css";
import "./showcase-studio.css";

const brutel = localFont({
  src: [
    { path: "../../public/fonts/brutel/Brutel-Thin.otf", weight: "100", style: "normal" },
    { path: "../../public/fonts/brutel/Brutel-ExtraLight.otf", weight: "200", style: "normal" },
    { path: "../../public/fonts/brutel/Brutel-Light.otf", weight: "300", style: "normal" },
    { path: "../../public/fonts/brutel/Brutel-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/brutel/Brutel-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/brutel/Brutel-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../../public/fonts/brutel/Brutel-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/fonts/brutel/Brutel-ExtraBold.otf", weight: "800", style: "normal" },
    { path: "../../public/fonts/brutel/Brutel-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-brutel",
  display: "swap",
  // Only request the weights a view uses instead of preloading all nine files.
  preload: false,
});
const inter = localFont({ src: "../../public/fonts/inter-ui.woff2", variable: "--font-inter", display: "swap", weight: "100 900", preload: false });

export const metadata: Metadata = {title:{default:"Overview · Techgy Link",template:"%s · Techgy Link"},description:"Your business. One intelligent workspace. Techgy Link demonstration.",icons:{icon:{url:"/techgy-link-logo.png",type:"image/png",sizes:"180x180"},apple:"/techgy-link-logo.png"}};
export default async function RootLayout({children}: {children: React.ReactNode}) {
  const records = await demoService.getRecords();
  return <html lang="en" className={`${brutel.variable} ${inter.variable}`}><body><WorkspaceProvider initialRecords={records}><AppShell>{children}</AppShell></WorkspaceProvider></body></html>;
}
