import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// This page exists solely to make /cart a valid URL.
// The cart is rendered as a drawer overlay inside the Header component.
// When this page loads, the Header detects pathname === "/cart" and opens the drawer.
export default function CartPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-[#999] text-[14px]">Loading your cart...</p>
    </div>
  );
}
