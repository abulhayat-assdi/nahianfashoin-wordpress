"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  Trash2,
} from "lucide-react";
import SiteConfirmModal from "@/components/ui/SiteConfirmModal";

const ACCOUNT_SLUGS = ['account', 'orders', 'my-account'];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    itemId: "",
    title: "",
    message: ""
  });
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [shopMenuImage, setShopMenuImage] = useState('/tea_workers_harvest.png');
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(data => {
      setUser(data.user || null);
    });
  }, []);

  // Fetch categories for the shop menu
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(json => {
      if (json.data && json.data.length > 0) {
        setCategories(json.data);
        setActiveCategory(json.data[0].name);
      }
    });
  }, []);

  // Fetch shop menu featured image
  useEffect(() => {
    fetch('/api/home-config').then(r => r.json()).then(json => {
      const img = (json.data?.data as any)?.shop_menu_image;
      if (img) setShopMenuImage(img);
    });
  }, []);

  // Fetch products for the menu
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(json => {
      if (json.data) setAllProducts(json.data);
    });
  }, []);

  // Handle auth-gated links (Account, Orders)
  const handleAccountLink = async (slug: string) => {
    if (user) {
      router.push(`/account-${slug === 'profile' ? 'order' : slug}`);
    } else {
      router.push('/account-register');
    }
    setMenuOpen(false);
  };

  // Sync cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setCartItems(parsed);
      } catch {}
    }
  }, []);

  // Open cart drawer when navigating to /cart
  useEffect(() => {
    if (pathname === "/cart") {
      setCartOpen(true);
    }
  }, [pathname]);

  const openCart = () => {
    router.push("/cart");
    setCartOpen(true);
  };

  const closeCart = () => {
    setCartOpen(false);
    if (pathname === "/cart") {
      router.back();
    }
  };

  useEffect(() => {
    if (menuOpen || searchOpen || cartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen, searchOpen, cartOpen]);

  useEffect(() => {
    const handleCartAdd = (e: any) => {
      const newItem = e.detail;
      
      // If we have a new item, add it to the state
      if (newItem && newItem.id) {
        setCartItems((prev) => {
          const existing = prev.find((item) => item.id === newItem.id);
          const updated = existing 
            ? prev.map((item) => item.id === newItem.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item)
            : [...prev, { ...newItem, quantity: 1 }];
          
          localStorage.setItem("cart", JSON.stringify(updated));
          return updated;
        });
        setCartOpen(true);
      } else {
        // Just reload from localStorage if no specific item was provided (e.g. sync event)
        const saved = localStorage.getItem("cart");
        if (saved) {
          try {
            setCartItems(JSON.parse(saved));
          } catch (err) {}
        }
      }
    };

    const handleCartClear = () => {
      setCartItems([]);
      setCartOpen(false);
    };

    window.addEventListener("cart:add", handleCartAdd);
    window.addEventListener("cart:clear", handleCartClear);
    return () => {
      window.removeEventListener("cart:add", handleCartAdd);
      window.removeEventListener("cart:clear", handleCartClear);
    };
  }, []);

  const cartTotal = cartItems.reduce((acc, item) => {
    const priceStr = item.price.replace(/[^0-9.]/g, "");
    return acc + parseFloat(priceStr || "0") * item.quantity;
  }, 0);

  const originalTotal = cartItems.reduce((acc, item) => {
    const priceStr = (item.originalPrice || item.price).replace(/[^0-9.]/g, "");
    return acc + parseFloat(priceStr || "0") * item.quantity;
  }, 0);

  const totalDiscount = originalTotal - cartTotal;

  // Filter products for active category
  const activeCat = categories.find(c => c.name === activeCategory);
  const currentCategoryProducts = allProducts.filter(p =>
    activeCat ? (p.category === activeCat.name || p.category === activeCat.slug) : false
  );

  const searchResults = searchQuery.trim() 
    ? allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleLogoClick = (e: React.MouseEvent) => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
    
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-[100] h-[74px] border-b border-[#eee8df] bg-white">
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center px-5 md:px-[118px]">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-4 text-brand-green justify-self-start transition-colors hover:text-black"
            aria-expanded={menuOpen}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X size={25} strokeWidth={1.5} /> : <Menu size={25} strokeWidth={1.5} />}
            <span className="hidden md:block font-heading text-[22px] font-bold uppercase tracking-[0.04em]">
              Shop
            </span>
          </button>

          <Link href="/" onClick={handleLogoClick} className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Nahian Fashion"
              width={160}
              height={50}
              className="h-[50px] w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center justify-self-end gap-6 text-brand-green">
            <Link href="/blog" className="hidden md:block px-4 py-1.5 border border-brand-green text-brand-green rounded-full text-[13px] font-bold uppercase tracking-wider hover:bg-brand-green hover:text-white transition-colors">
              Blog
            </Link>
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="transition-colors hover:text-black">
              <Search size={23} strokeWidth={1.5} />
            </button>
            <Link href={user ? "/account-order" : "/account-register"} aria-label="User Account" className="hidden md:block transition-colors hover:text-black">
              <User size={22} strokeWidth={1.5} />
            </Link>
            <button type="button" onClick={openCart} aria-label="Shopping Cart" className="relative transition-colors hover:text-black">
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartItems.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="fixed left-0 right-0 top-[74px] bottom-0 z-[110] bg-white px-6 py-8 md:py-[70px] shadow-2xl md:px-[108px] overflow-y-auto md:bottom-auto md:overflow-visible">
            <div className="flex flex-col md:grid gap-8 md:gap-12 md:grid-cols-[320px_1fr_405px]">
              {/* Category list */}
              <div className="flex flex-col space-y-4 md:space-y-7 border-b md:border-b-0 md:border-r border-[#d8c9ad] pb-6 md:pb-0 md:pr-10">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveCategory(category.name);
                    }}
                    onMouseEnter={() => setActiveCategory(category.name)}
                    className={`block w-fit text-left text-[16px] md:text-[19px] font-bold uppercase tracking-[0.08em] transition-colors select-text ${
                      activeCategory === category.name ? "text-brand-gold underline underline-offset-[6px] decoration-2" : "text-[#202020] hover:text-brand-gold"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
                <Link
                  href="/blog"
                  onClick={() => setMenuOpen(false)}
                  className="block w-fit text-left text-[16px] md:text-[19px] font-bold uppercase tracking-[0.08em] transition-colors text-[#202020] hover:text-brand-gold mt-6 pt-6 border-t border-[#d8c9ad]/50"
                >
                  Blog
                </Link>
              </div>

              {/* Subcategory/Product links */}
              <div className="flex flex-col space-y-4 md:space-y-5 text-[16px] md:text-[18px] text-[#222]">
                {/* Always show "All Category" link */}
                <Link
                  href={`/collections/${activeCat?.slug || activeCategory.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block font-bold transition-colors hover:text-brand-green border-b border-[#eee] pb-2 mb-2"
                  onClick={() => setMenuOpen(false)}
                >
                  All {activeCategory}
                </Link>
                
                {currentCategoryProducts.length > 0 ? (
                  currentCategoryProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="block transition-colors hover:text-brand-gold text-[15px] md:text-[17px]"
                      onClick={() => setMenuOpen(false)}
                    >
                      {p.name}
                    </Link>
                  ))
                ) : (
                  <p className="text-[14px] text-gray-400 italic">No products in this category yet.</p>
                )}
              </div>

              {/* Featured image */}
              <Link
                href="/collections/all"
                className="group relative h-[250px] md:h-auto md:min-h-[405px] w-full overflow-hidden shrink-0 mt-4 md:mt-0"
                onClick={() => setMenuOpen(false)}
              >
                <img
                  src={shopMenuImage}
                  alt="Shop menu featured image"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute bottom-4 left-4 right-4 md:left-9 md:right-9 bg-brand-gold px-4 md:px-6 py-4 md:py-5 text-center text-[14px] md:text-[16px] font-bold uppercase tracking-[0.04em] text-white">
                  Shop Single Estate Teas
                </span>
              </Link>
            </div>
          </nav>
        </>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm">
          <aside className="ml-auto h-full w-full max-w-[648px] bg-white p-10 md:p-[40px] shadow-2xl flex flex-col">
            <div className="flex items-center border-b-2 border-[#222] pb-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for..."
                className="h-[58px] flex-1 bg-transparent text-[24px] md:text-[31px] text-[#222] outline-none placeholder:text-[#999]"
              />
              <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} aria-label="Close search" className="hover:rotate-90 transition-transform duration-300">
                <X size={28} strokeWidth={1.7} />
              </button>
            </div>

            <div className="mt-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {searchQuery.trim() !== "" ? (
                searchResults.length > 0 ? (
                  <div className="grid gap-6">
                    <p className="text-[12px] uppercase tracking-widest text-[#999] font-bold">{searchResults.length} products found</p>
                    {searchResults.map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/products/${product.slug}`}
                        onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                        className="flex items-center gap-4 group border-b border-[#f5f5f5] pb-4"
                      >
                        <div className="h-20 w-20 bg-brand-cream border border-[#eee] rounded-xl overflow-hidden flex-shrink-0">
                          {product.media_urls?.[0] ? (
                            <img src={product.media_urls[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[#ddd]">
                              <ShoppingBag size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-[18px] font-bold text-[#222] group-hover:text-brand-gold transition-colors line-clamp-1">{product.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[14px] text-brand-gold font-bold">{product.price}</p>
                            <span className="text-[11px] uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded text-[#777]">{product.category}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <Search size={48} className="mx-auto text-[#eee] mb-4" />
                    <p className="text-[#999] text-[18px]">No products found for "<span className="text-[#222] font-semibold">{searchQuery}</span>"</p>
                    <p className="text-[#bbb] text-[14px] mt-2">Try checking for typos or use more general terms.</p>
                  </div>
                )
              ) : (
                <div className="py-10">
                  <p className="text-[12px] uppercase tracking-widest text-[#999] font-bold mb-6">Popular Categories</p>
                  <div className="flex flex-wrap gap-3">
                    {categories.map(cat => (
                      <Link
                        key={cat.id}
                        href={`/collections/${cat.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="px-6 py-3 bg-[#f9f9f9] hover:bg-brand-gold hover:text-white transition-all rounded-full text-[14px] font-bold text-[#222] border border-[#eee]"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm" onClick={closeCart}>
          <aside className="ml-auto flex h-full w-full max-w-[480px] flex-col bg-white" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-center border-b border-[#eee] py-5 px-6 relative">
              <h2 className="font-heading text-[21px] text-[#b48f52] tracking-wide">Cart</h2>
              <button className="absolute right-6 text-[#b48f52]" type="button" onClick={closeCart}>
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>
            
            {/* Notification Banner */}
            <div className="bg-white py-3 text-center border-b-[3px] border-[#b48f52]">
              <p className="text-[14px] font-medium text-[#222]">You are eligible for free shipping.</p>
            </div>
 
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <h3 className="font-heading text-[33px] text-brand-gold">Your Cart is Empty</h3>
                  <Link 
                    href="/collections/all" 
                    className="flex items-center justify-center bg-[#b48f52] mt-6 w-full py-4 text-[18px] font-bold text-white transition hover:bg-[#9e7c46]"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 border-b border-[#eee] pb-6">
                      <div className="h-[80px] w-[80px] shrink-0 bg-[#f8f5f0] border border-[#eee] flex items-center justify-center overflow-hidden">
                        {item.image && item.image.trim() !== "" ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-[#ccc]"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5"/><path d="M3 9l4-4 4 4 4-4 4 4" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="14" r="2" strokeWidth="1.5"/></svg>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[15px] leading-tight text-[#222] font-medium">{item.name}</p>
                          <button
                            type="button"
                            className="text-[#999] hover:text-[#555]"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                itemId: item.id,
                                title: "Remove Item?",
                                message: `Are you sure you want to remove "${item.name}" from your cart?`
                              });
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-end justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 items-center border border-[#ddd] px-1 text-[14px]">
                              <button 
                                className="px-2 h-full text-[#999] hover:text-[#222]" 
                                onClick={() => setCartItems((prev) => {
                                  const updated = prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i);
                                  localStorage.setItem("cart", JSON.stringify(updated));
                                  return updated;
                                })}
                              >-</button>
                              <span className="px-2 font-medium">{item.quantity}</span>
                              <button 
                                className="px-2 h-full text-[#999] hover:text-[#222]"
                                onClick={() => setCartItems((prev) => {
                                  const updated = prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                                  localStorage.setItem("cart", JSON.stringify(updated));
                                  return updated;
                                })}
                              >+</button>
                            </div>
                            {item.discount && (
                              <span className="bg-[#f6efe4] px-2 py-1 text-[11px] font-bold text-[#b48f52] uppercase">{item.discount}</span>
                            )}
                          </div>
                          <div className="text-right flex flex-col">
                            {item.originalPrice && (
                              <span className="text-[12px] text-[#999] line-through">
                                ৳ {parseFloat(item.originalPrice.replace(/[^0-9.]/g, "")).toLocaleString('en-US', {minimumFractionDigits: 2})}
                              </span>
                            )}
                            <span className="text-[15px] text-[#222]">৳ {(parseFloat(item.price.replace(/[^0-9.]/g, "")) * item.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-[#eee] bg-white">
                <div className="px-6 pt-4 pb-3 flex justify-between items-end">
                  <div>
                    <p className="text-[16px] font-medium text-[#222]">Total ({cartItems.length} ITEM{cartItems.length > 1 ? 'S' : ''})</p>
                    {totalDiscount > 0 && (
                      <p className="text-[13px] text-green-600 font-bold mt-1">Discount Applied: ৳ {totalDiscount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {totalDiscount > 0 && (
                      <span className="text-[13px] text-[#999] line-through mb-0.5">৳ {originalTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    )}
                    <span className="text-[18px] font-medium text-[#222]">৳ {cartTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>

                <Link href="/checkout" onClick={() => setCartOpen(false)} className="flex w-full items-center justify-center gap-2 bg-[#b48f52] py-4 text-[15px] font-bold uppercase tracking-widest text-white transition hover:bg-[#9e7c46]">
                  SECURE CHECKOUT
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mb-0.5">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                  </svg>
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
      <SiteConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          setCartItems((prev) => {
            const updated = prev.filter((i) => i.id !== confirmModal.itemId);
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
          });
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </>
  );
}
