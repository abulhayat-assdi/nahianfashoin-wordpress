import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SiteLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      {modal}
      <Footer />
    </>
  );
}
