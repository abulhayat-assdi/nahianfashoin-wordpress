import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { prisma } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { readFile } from "fs/promises";
import { join } from "path";

async function getLogoVersion(): Promise<number> {
  try {
    const content = await readFile(
      join(process.cwd(), "public", "uploads", "logo-version.json"),
      "utf8"
    );
    return JSON.parse(content).v ?? 1;
  } catch {
    return 1;
  }
}

export default async function SiteLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  noStore();
  let whatsappNumber: string | null = null;
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { whatsapp_number: true },
    });
    whatsappNumber = settings?.whatsapp_number ?? null;
  } catch {}

  const logoVersion = await getLogoVersion();

  return (
    <>
      <Header logoVersion={logoVersion} />
      <main className="flex-1 w-full pb-[60px] md:pb-0">{children}</main>
      {modal}
      <Footer />
      <BottomNav whatsappNumber={whatsappNumber} />
    </>
  );
}
