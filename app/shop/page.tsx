"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  LockKeyhole,
  LogIn,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X
} from "lucide-react";
import { shopProducts, type ShopProduct } from "@/lib/shopCatalog";
import { supabase } from "@/lib/supabaseClient";

type Cart = Record<string, number>;
type StockProductsResponse = {
  products: ShopProduct[];
  source: "stock" | "fallback";
  updatedAt: string | null;
  error?: string;
};
type CheckoutForm = {
  customerName: string;
  phone: string;
  branchName: string;
  deliveryMethod: "delivery" | "pickup";
  address: string;
  paymentMethod: "transfer" | "cod";
  note: string;
};
type FranchiseeProfile = {
  id: string;
  branch_name: string;
  owner_name: string;
  phone: string;
  email: string;
  shipping_address: string | null;
  status: "Pending" | "Active" | "Suspended";
  payment_terms: string;
  credit_limit: number;
  preview?: boolean;
};

const initialForm: CheckoutForm = {
  customerName: "",
  phone: "",
  branchName: "",
  deliveryMethod: "delivery",
  address: "",
  paymentMethod: "transfer",
  note: ""
};

function baht(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(value);
}

function ProductImage({ product }: { product: ShopProduct }) {
  if (product.image.startsWith("/") && !product.image.startsWith("//")) {
    return <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-contain p-3 transition duration-500 group-hover:scale-105 sm:p-5" />;
  }

  return <img src={product.image} alt={product.name} className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105 sm:p-5" loading="lazy" />;
}

export default function CustomerShopPage() {
  const router = useRouter();
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [products, setProducts] = useState<ShopProduct[]>(shopProducts);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSource, setCatalogSource] = useState<"stock" | "fallback">("fallback");
  const [catalogUpdatedAt, setCatalogUpdatedAt] = useState<string | null>(null);
  const [catalogNotice, setCatalogNotice] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ orderNumber: string; lineNotified: boolean } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<FranchiseeProfile | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!supabaseConfigured) {
        setAccessError("พอร์ทัลแฟรนไชส์ซีต้องตั้งค่า Supabase ก่อนใช้งานจริง");
        setAuthLoading(false);
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login?next=/shop");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("franchisee_profiles")
        .select("id,branch_name,owner_name,phone,email,shipping_address,status,payment_terms,credit_limit")
        .eq("user_id", session.user.id)
        .single();

      if (!mounted) return;

      if (profileError || !data) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("full_name,email,role")
          .eq("id", session.user.id)
          .single();

        const userRole = String(userProfile?.role || "");
        const isBackOfficeUser = Boolean(userProfile) && userRole !== "Franchisee";

        if (isBackOfficeUser && userProfile) {
          const hqProfile: FranchiseeProfile = {
            id: "hq-preview",
            branch_name: "HQ Preview",
            owner_name: userProfile.full_name || "DomiCha HQ",
            phone: "-",
            email: userProfile.email || session.user.email || "",
            shipping_address: "",
            status: "Active",
            payment_terms: "โหมดดูตัวอย่าง",
            credit_limit: 0,
            preview: true
          };
          setPreviewMode(true);
          setProfile(hqProfile);
          setForm((current) => ({
            ...current,
            customerName: hqProfile.owner_name,
            phone: hqProfile.phone,
            branchName: hqProfile.branch_name,
            address: ""
          }));
          setAuthLoading(false);
          return;
        }

        setAccessError("บัญชีนี้ยังไม่ได้ถูกเพิ่มเป็นแฟรนไชส์ซีโดย HQ");
        setAuthLoading(false);
        return;
      }

      const franchisee = data as FranchiseeProfile;
      if (franchisee.status !== "Active") {
        setAccessError(franchisee.status === "Pending" ? "บัญชีแฟรนไชส์ซีนี้ยังรอ HQ อนุมัติ" : "บัญชีแฟรนไชส์ซีนี้ถูกระงับ กรุณาติดต่อ HQ");
        setProfile(franchisee);
        setAuthLoading(false);
        return;
      }

      setPreviewMode(false);
      setProfile(franchisee);
      setForm((current) => ({
        ...current,
        customerName: franchisee.owner_name,
        phone: franchisee.phone,
        branchName: franchisee.branch_name,
        address: franchisee.shipping_address || ""
      }));
      setAuthLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router, supabaseConfigured]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setCatalogLoading(true);
      try {
        const response = await fetch("/api/stock-products", { cache: "no-store" });
        const payload = (await response.json()) as StockProductsResponse;
        if (!response.ok) throw new Error(payload.error || "โหลดรายการสินค้าไม่สำเร็จ");
        if (!mounted) return;
        setProducts(payload.products.length ? payload.products : shopProducts);
        setCatalogSource(payload.source);
        setCatalogUpdatedAt(payload.updatedAt);
        setCatalogNotice(payload.source === "stock" ? "" : payload.error || "ใช้รายการสินค้าสำรอง");
      } catch (loadError) {
        if (!mounted) return;
        setProducts(shopProducts);
        setCatalogSource("fallback");
        setCatalogNotice(loadError instanceof Error ? loadError.message : "ใช้รายการสินค้าสำรอง");
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))], [products]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) =>
      (category === "ทั้งหมด" || product.category === category) &&
      (!normalized || `${product.name} ${product.description}`.toLowerCase().includes(normalized))
    );
  }, [category, products, query]);

  const cartItems = useMemo(() => products
    .filter((product) => cart[product.id])
    .map((product) => ({
      product,
      quantity: cart[product.id],
      lineTotal: product.price * cart[product.id]
    })), [cart, products]);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = form.deliveryMethod === "delivery" && subtotal < 5_000 ? 80 : 0;
  const total = subtotal + deliveryFee;

  function changeQuantity(productId: string, amount: number) {
    const product = products.find((item) => item.id === productId);
    if (!product || product.stock === 0) return;

    setCart((current) => {
      const maxQuantity = typeof product.stock === "number" && product.stock > 0 ? Math.min(99, Math.floor(product.stock)) : 99;
      const nextQuantity = Math.max(0, Math.min(maxQuantity, (current[productId] || 0) + amount));
      if (!nextQuantity) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: nextQuantity };
    });
  }

  function openCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
    setError("");
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      setError("กรุณาเข้าสู่ระบบด้วยบัญชีแฟรนไชส์ซีก่อนสั่งซื้อ");
      return;
    }
    if (profile.preview || previewMode) {
      setError("โหมดเจ้าของใช้ดูตัวอย่างหน้าร้านเท่านั้น หากต้องการทดสอบสั่งซื้อ กรุณาเข้าสู่ระบบด้วยบัญชีแฟรนไชส์ซี");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...form,
          customerName: profile.owner_name,
          phone: profile.phone,
          branchName: profile.branch_name,
          items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ไม่สามารถส่งคำสั่งซื้อได้");
      setSuccess(result);
      setCheckoutOpen(false);
      setCart({});
      setForm({
        ...initialForm,
        customerName: profile.owner_name,
        phone: profile.phone,
        branchName: profile.branch_name,
        address: profile.shipping_address || ""
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ไม่สามารถส่งคำสั่งซื้อได้");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="shop-shell grid min-h-screen place-items-center px-5 text-stone-950">
        <section className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/90 p-7 text-center shadow-2xl shadow-orange-950/10">
          <Image src="/icons/domicha-original-logo.png" alt="Domi Cha" width={80} height={80} className="mx-auto h-20 w-20 object-contain" priority />
          <h1 className="mt-4 text-2xl font-black">กำลังตรวจสอบสิทธิ์แฟรนไชส์ซี</h1>
          <p className="mt-2 text-sm text-stone-500">ระบบนี้สำหรับเจ้าของสาขา DomiCha ที่ HQ สร้างบัญชีให้เท่านั้น</p>
        </section>
      </main>
    );
  }

  if (accessError) {
    return (
      <main className="shop-shell grid min-h-screen place-items-center px-5 text-stone-950">
        <section className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/90 p-7 text-center shadow-2xl shadow-orange-950/10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange-50 text-orange-600">
            <LockKeyhole className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-black">พอร์ทัลนี้เปิดเฉพาะแฟรนไชส์ซี</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">{accessError}</p>
          <button onClick={() => router.push("/login?next=/shop")} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 font-bold text-white">
            <LogIn className="h-4 w-4" /> เข้าสู่ระบบแฟรนไชส์ซี
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="shop-shell min-h-screen pb-32 text-stone-950">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-[#fffaf3]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Image src="/icons/domicha-original-logo.png" alt="Domi Cha" width={58} height={58} className="h-[58px] w-[58px] object-contain" priority />
          <div className="min-w-0">
            <strong className="block text-[17px] tracking-tight">{previewMode ? "DomiCha Shop Preview" : "DomiCha Franchise"}</strong>
            <span className="block truncate text-xs text-stone-500">{previewMode ? "โหมดเจ้าของดูหน้าร้าน" : profile?.branch_name || "พอร์ทัลสั่งซื้อวัตถุดิบ"}</span>
          </div>
          <button onClick={() => setCartOpen(true)} className="relative ml-auto grid h-11 w-11 place-items-center rounded-2xl bg-stone-950 text-white shadow-lg shadow-stone-950/15" aria-label="เปิดตะกร้า">
            <ShoppingBag className="h-5 w-5" />
            {itemCount ? <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold">{itemCount}</span> : null}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="shop-hero mt-5 overflow-hidden rounded-[30px] bg-stone-950 px-5 py-7 text-white shadow-2xl shadow-orange-950/10 sm:px-10 sm:py-11">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-200">
              <Sparkles className="h-3.5 w-3.5" /> {previewMode ? "HQ Shop Preview" : "Private Franchisee Portal"}
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-.03em] sm:text-5xl">
              {previewMode ? "ดูหน้าร้านสำหรับแฟรนไชส์ซี" : "สั่งวัตถุดิบสำหรับสาขา"}<br /><span className="text-orange-400">{previewMode ? "ในมุมมองเจ้าของ/HQ" : "เฉพาะแฟรนไชส์ซี DomiCha"}</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-stone-300 sm:text-base">
              {previewMode ? "หน้านี้เป็นโหมดดูตัวอย่างสำหรับเจ้าของ สามารถดูสินค้า ราคา สต๊อก และหน้าตาตะกร้าได้ แต่ไม่ส่งคำสั่งซื้อจริง" : "เข้าสู่ระบบด้วยบัญชีที่ HQ สร้างให้ เลือกสินค้า และส่งออเดอร์ถึงทีม DomiCha ผ่าน LINE OA ได้ในไม่กี่ขั้นตอน"}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-stone-300">
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-orange-400" /> ฟรีค่าส่งเมื่อครบ 5,000 บาท</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> สินค้าจากศูนย์ DomiCha</span>
              <span className="flex items-center gap-1.5"><PackageCheck className="h-4 w-4 text-sky-300" /> {catalogSource === "stock" ? "เชื่อมกับ DomiCha Stock" : "ใช้สินค้าสำรอง"}</span>
            </div>
            {previewMode ? (
              <div className="mt-6 rounded-2xl border border-orange-300/20 bg-orange-500/10 p-4 text-sm leading-6 text-orange-100">
                โหมดนี้สำหรับเจ้าของดูหน้าร้านเท่านั้น หากต้องการทดสอบส่งออเดอร์จริง ให้สร้างบัญชีแฟรนไชส์ซีแล้วล็อกอินด้วยบัญชีนั้น
              </div>
            ) : null}
          </div>
        </section>

        <section className="sticky top-[76px] z-20 -mx-4 mt-5 border-y border-orange-100/70 bg-[#fffaf3]/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชา ผงเครื่องดื่ม หรือไซรัป" className="h-12 rounded-2xl border-white bg-white/90 pl-11 shadow-sm" />
          </label>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${category === item ? "bg-stone-950 text-white shadow-lg" : "border border-stone-200 bg-white text-stone-600"}`}>
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Our products</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">เลือกวัตถุดิบ</h2>
              <p className="mt-1 text-xs text-stone-400">
                {catalogLoading ? "กำลังโหลดสินค้าจาก DomiCha Stock..." : catalogSource === "stock" ? `ข้อมูลจาก DomiCha Stock${catalogUpdatedAt ? ` • อัปเดต ${new Date(catalogUpdatedAt).toLocaleString("th-TH")}` : ""}` : `ใช้สินค้าสำรอง${catalogNotice ? ` • ${catalogNotice}` : ""}`}
              </p>
            </div>
            <span className="text-sm text-stone-400">{filteredProducts.length} รายการ</span>
          </div>
          {catalogNotice && catalogSource === "fallback" ? (
            <p className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              ยังดึง DomiCha Stock ไม่ได้ชั่วคราว ระบบจึงใช้รายการสินค้าสำรองก่อน
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const quantity = cart[product.id] || 0;
              const outOfStock = product.stock === 0;
              return (
                <article key={product.id} className={`group overflow-hidden rounded-[24px] border border-white/80 bg-white/80 shadow-[0_12px_40px_rgba(75,43,20,.07)] backdrop-blur sm:rounded-[28px] ${outOfStock ? "opacity-60" : ""}`}>
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-orange-50 via-[#fffaf4] to-amber-100/60">
                    <ProductImage product={product} />
                    {product.badge ? <span className="absolute left-3 top-3 rounded-full bg-stone-950 px-2.5 py-1 text-[10px] font-bold text-white">{product.badge}</span> : null}
                    {typeof product.stock === "number" ? <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-stone-600 shadow-sm">คลัง {product.stock.toLocaleString("th-TH")}</span> : null}
                  </div>
                  <div className="p-3.5 sm:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-orange-600">{product.category}</p>
                    <h3 className="mt-1 min-h-10 text-sm font-bold leading-5 sm:text-base">{product.name}</h3>
                    <p className="mt-1 hidden text-xs leading-5 text-stone-500 sm:block">{product.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div>
                        <strong className="block text-base sm:text-lg">{baht(product.price)}</strong>
                        <span className="text-[11px] text-stone-400">ต่อ {product.unit}</span>
                      </div>
                      {outOfStock ? (
                        <button disabled className="h-10 rounded-2xl bg-stone-200 px-3 text-xs font-bold text-stone-500">หมด</button>
                      ) : quantity ? (
                        <div className="flex items-center gap-1 rounded-2xl bg-stone-950 p-1 text-white">
                          <button onClick={() => changeQuantity(product.id, -1)} className="grid h-8 w-8 place-items-center rounded-xl hover:bg-white/10" aria-label={`ลด ${product.name}`}><Minus className="h-3.5 w-3.5" /></button>
                          <strong className="min-w-5 text-center text-sm">{quantity}</strong>
                          <button onClick={() => changeQuantity(product.id, 1)} className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500" aria-label={`เพิ่ม ${product.name}`}><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => changeQuantity(product.id, 1)} className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25" aria-label={`เพิ่ม ${product.name}`}><Plus className="h-5 w-5" /></button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {itemCount ? (
        <button onClick={() => setCartOpen(true)} className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-xl items-center rounded-[22px] bg-stone-950 p-2 pl-4 text-white shadow-2xl shadow-stone-950/30">
          <span className="grid h-10 min-w-10 place-items-center rounded-2xl bg-orange-500 text-sm font-black">{itemCount}</span>
          <span className="ml-3 text-left">
            <span className="block text-xs text-stone-400">ยอดสินค้า</span>
            <strong className="block">{baht(subtotal)}</strong>
          </span>
          <span className="ml-auto flex items-center gap-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-stone-950">ดูตะกร้า <ChevronRight className="h-4 w-4" /></span>
        </button>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/45 backdrop-blur-sm sm:items-center sm:p-5">
          <button className="absolute inset-0" onClick={() => setCartOpen(false)} aria-label="ปิดตะกร้า" />
          <section className="relative z-10 max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-[30px] bg-[#fffaf3] p-5 shadow-2xl sm:rounded-[30px] sm:p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-widest text-orange-600">Your cart</p><h2 className="mt-1 text-2xl font-black">ตะกร้าสินค้า</h2></div>
              <button onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white" aria-label="ปิด"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-3">
              {cartItems.map(({ product, quantity, lineTotal }) => (
                <article key={product.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-orange-50"><Image src={product.image} alt="" fill sizes="64px" className="object-contain p-1" /></div>
                  <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{product.name}</strong><span className="text-xs text-stone-400">{baht(product.price)} / {product.unit}</span></div>
                  <div className="text-right">
                    <strong className="block text-sm">{baht(lineTotal)}</strong>
                    <div className="mt-1 flex items-center gap-2"><button onClick={() => changeQuantity(product.id, -1)} className="text-stone-400" aria-label="ลด"><Minus className="h-4 w-4" /></button><span className="min-w-5 text-sm">{quantity}</span><button onClick={() => changeQuantity(product.id, 1)} className="text-orange-600" aria-label="เพิ่ม"><Plus className="h-4 w-4" /></button></div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-orange-50 p-4 text-sm">
              <div className="flex justify-between text-stone-500"><span>ยอดสินค้า</span><strong className="text-stone-950">{baht(subtotal)}</strong></div>
              <p className="mt-2 text-xs text-orange-700">{subtotal >= 5_000 ? "🎉 ออเดอร์นี้ได้รับสิทธิ์จัดส่งฟรี" : `สั่งเพิ่มอีก ${baht(5_000 - subtotal)} เพื่อรับสิทธิ์จัดส่งฟรี`}</p>
            </div>
            <button onClick={openCheckout} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/25">
              {previewMode ? "ดูหน้าฟอร์มยืนยัน" : "ดำเนินการสั่งซื้อ"} <ChevronRight className="h-5 w-5" />
            </button>
          </section>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fffaf3]">
          <form onSubmit={submitOrder} className="mx-auto min-h-screen max-w-2xl px-4 pb-10 sm:px-6">
            <header className="sticky top-0 z-10 -mx-4 flex h-[72px] items-center gap-3 border-b border-orange-100 bg-[#fffaf3]/90 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
              <button type="button" onClick={() => setCheckoutOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="ย้อนกลับ"><ArrowLeft className="h-5 w-5" /></button>
              <div><strong className="block">ยืนยันคำสั่งซื้อ</strong><span className="text-xs text-stone-400">{itemCount} รายการ • {baht(total)}</span></div>
            </header>
            <section className="mt-6 rounded-[28px] bg-stone-950 p-5 text-white">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500"><PackageCheck className="h-5 w-5" /></span><div><p className="text-xs text-stone-400">สรุปยอดคำสั่งซื้อ</p><strong className="text-2xl">{baht(total)}</strong></div></div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs"><span className="text-stone-400">ยอดสินค้า <b className="block pt-1 text-sm text-white">{baht(subtotal)}</b></span><span className="text-stone-400">ค่าจัดส่ง <b className="block pt-1 text-sm text-white">{deliveryFee ? baht(deliveryFee) : "ฟรี"}</b></span></div>
            </section>

            <section className="mt-5 space-y-4 rounded-[28px] border border-white bg-white/80 p-5 shadow-sm sm:p-6">
              <div><h2 className="font-bold">ข้อมูลแฟรนไชส์ซี</h2><p className="mt-1 text-xs text-stone-400">ข้อมูลนี้มาจากบัญชีที่ HQ สร้างไว้ให้</p></div>
              <label className="block">ชื่อผู้ติดต่อ<input required readOnly value={form.customerName} className="mt-1.5 h-12 rounded-2xl bg-stone-50 text-stone-500" placeholder="ชื่อ-นามสกุล" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">เบอร์โทร<input required readOnly inputMode="tel" value={form.phone} className="mt-1.5 h-12 rounded-2xl bg-stone-50 text-stone-500" placeholder="08x-xxx-xxxx" /></label>
                <label className="block">ชื่อสาขา / ร้าน<input required readOnly value={form.branchName} className="mt-1.5 h-12 rounded-2xl bg-stone-50 text-stone-500" placeholder="เช่น DomiCha บางแสน" /></label>
              </div>
            </section>

            {previewMode ? (
              <p className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-800">
                คุณกำลังดูในโหมดเจ้าของ ระบบจะไม่ส่งคำสั่งซื้อจริงจากบัญชีนี้
              </p>
            ) : null}

            <section className="mt-5 space-y-4 rounded-[28px] border border-white bg-white/80 p-5 shadow-sm sm:p-6">
              <h2 className="font-bold">การรับสินค้า</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "delivery" as const, label: "จัดส่ง", detail: "ส่งถึงร้าน", icon: Truck },
                  { value: "pickup" as const, label: "รับที่ศูนย์", detail: "ไม่เสียค่าจัดส่ง", icon: MapPin }
                ].map((option) => {
                  const Icon = option.icon;
                  const active = form.deliveryMethod === option.value;
                  return <button key={option.value} type="button" onClick={() => setForm({ ...form, deliveryMethod: option.value })} className={`rounded-2xl border p-4 text-left ${active ? "border-orange-500 bg-orange-50" : "border-stone-200 bg-white"}`}><Icon className={`h-5 w-5 ${active ? "text-orange-600" : "text-stone-400"}`} /><strong className="mt-2 block text-sm">{option.label}</strong><span className="text-xs text-stone-400">{option.detail}</span></button>;
                })}
              </div>
              {form.deliveryMethod === "delivery" ? <label className="block">ที่อยู่จัดส่ง<textarea required rows={3} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1.5 rounded-2xl" placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" /></label> : null}
            </section>

            <section className="mt-5 space-y-4 rounded-[28px] border border-white bg-white/80 p-5 shadow-sm sm:p-6">
              <h2 className="font-bold">การชำระเงิน</h2>
              <select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as CheckoutForm["paymentMethod"] })} className="h-12 rounded-2xl">
                <option value="transfer">โอนเงินผ่านธนาคาร</option>
                <option value="cod">เก็บเงินปลายทาง</option>
              </select>
              <label className="block">หมายเหตุ<textarea rows={2} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className="mt-1.5 rounded-2xl" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" /></label>
            </section>

            {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
            <button disabled={submitting} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white shadow-xl shadow-orange-500/25 disabled:opacity-60">
              {submitting ? <><Clock3 className="h-5 w-5 animate-spin" /> กำลังส่งคำสั่งซื้อ...</> : <><Check className="h-5 w-5" /> {previewMode ? "ปุ่มนี้ปิดในโหมดเจ้าของ" : `ยืนยันสั่งซื้อ ${baht(total)}`}</>}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-stone-400">เมื่อยืนยัน ข้อมูลคำสั่งซื้อจะถูกส่งให้ทีมงานผ่าน LINE OA เพื่อดำเนินการต่อ</p>
          </form>
        </div>
      ) : null}

      {success ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-stone-950/55 p-5 backdrop-blur">
          <section className="w-full max-w-md rounded-[32px] bg-white p-6 text-center shadow-2xl sm:p-8">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-9 w-9" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-emerald-600">Order received</p>
            <h2 className="mt-2 text-2xl font-black">รับคำสั่งซื้อแล้ว</h2>
            <p className="mt-2 text-sm text-stone-500">เลขที่คำสั่งซื้อ</p>
            <strong className="mt-1 block text-lg text-orange-600">{success.orderNumber}</strong>
            <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-left text-sm text-stone-600">
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> บันทึกคำสั่งซื้อเรียบร้อย</p>
              <p className="mt-2 flex items-center gap-2"><Check className={`h-4 w-4 ${success.lineNotified ? "text-emerald-500" : "text-amber-500"}`} /> {success.lineNotified ? "แจ้งเตือนทีมงานผ่าน LINE OA แล้ว" : "โหมดตัวอย่าง — รอตั้งค่า LINE OA"}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="mt-5 h-12 w-full rounded-2xl bg-stone-950 font-bold text-white">เลือกซื้อสินค้าต่อ</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
