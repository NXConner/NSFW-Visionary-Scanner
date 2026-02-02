/**
 * DLC Store Hook
 * Provides store-specific functionality
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useDLC } from "../context/DLCContext";
import type { DLCPackage } from "../core/types";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";

interface CartItem {
  package: DLCPackage;
  quantity: number;
}

interface UseDLCStoreReturn {
  // Cart
  cart: CartItem[];
  cartTotal: number;
  addToCart: (pkg: DLCPackage) => void;
  removeFromCart: (packageId: string) => void;
  clearCart: () => void;

  // Wishlist
  wishlist: string[];
  addToWishlist: (packageId: string) => Promise<void>;
  removeFromWishlist: (packageId: string) => Promise<void>;
  isInWishlist: (packageId: string) => boolean;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  sortBy: "price" | "rating" | "date" | "name";
  setSortBy: (sort: "price" | "rating" | "date" | "name") => void;
  filteredPackages: DLCPackage[];

  // Promo
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoDiscount: number;
  applyPromo: () => Promise<boolean>;
}

export function useDLCStore(): UseDLCStoreReturn {
  const { packages } = useDLC();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "rating" | "date" | "name">("date");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);

  const PROMO_STORAGE_KEY = "morphoscan_dlc_pending_promo_code";

  // Hydrate promo code from URL or localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const fromUrl = params.get("promo")?.trim();
      const fromStorage = window.localStorage.getItem(PROMO_STORAGE_KEY)?.trim();
      const resolved = (fromUrl || fromStorage || "").trim();
      if (resolved) {
        setPromoCode(resolved.toUpperCase());
        window.localStorage.setItem(PROMO_STORAGE_KEY, resolved.toUpperCase());
      }
    } catch {
      // ignore
    }
  }, []);

  // Load wishlist from DB (dlc_wishlist_packages)
  useEffect(() => {
    const run = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          setWishlist([]);
          return;
        }

        const { data, error } = await fromExtended("dlc_wishlist_packages")
          .select("package_id")
          .eq("user_id", auth.user.id)
          .order("added_at", { ascending: false })
          .limit(500);
        if (error) return;
        const ids = (data || []).map((r: Record<string, unknown>) => String(r.package_id));
        setWishlist(ids);
      } catch {
        // ignore
      }
    };
    void run();
  }, []);

  // Cart functions
  const addToCart = useCallback((pkg: DLCPackage) => {
    setCart(prev => {
      const existing = prev.find(item => item.package.packageId === pkg.packageId);
      if (existing) return prev;
      return [...prev, { package: pkg, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((packageId: string) => {
    setCart(prev => prev.filter(item => item.package.packageId !== packageId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => {
    const total = cart.reduce((sum, item) => {
      return sum + item.package.priceUsd * item.quantity;
    }, 0);
    return total * (1 - promoDiscount / 100);
  }, [cart, promoDiscount]);

  // Wishlist functions
  const addToWishlist = useCallback(async (packageId: string) => {
    const id = String(packageId);
    setWishlist(prev => (prev.includes(id) ? prev : [id, ...prev]));
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      await fromExtended("dlc_wishlist_packages").upsert(
        {
          user_id: auth.user.id,
          package_id: id,
          priority: 0,
          notify_on_sale: true,
          notify_on_release: true,
        },
        { onConflict: "user_id,package_id" },
      );
    } catch {
      // ignore
    }
  }, []);

  const removeFromWishlist = useCallback(async (packageId: string) => {
    const id = String(packageId);
    setWishlist(prev => prev.filter(x => x !== id));
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      await fromExtended("dlc_wishlist_packages")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("package_id", id);
    } catch {
      // ignore
    }
  }, []);

  const isInWishlist = useCallback(
    (packageId: string) => {
      return wishlist.includes(packageId);
    },
    [wishlist],
  );

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    return packages
      .filter(pkg => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            pkg.packageName.toLowerCase().includes(query) ||
            pkg.safeDescription.toLowerCase().includes(query) ||
            pkg.features?.some(f => f.name.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .filter(pkg => {
        if (selectedCategory) {
          return pkg.features?.some(f => f.category === selectedCategory);
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price":
            return a.priceUsd - b.priceUsd;
          case "date":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "name":
            return a.packageName.localeCompare(b.packageName);
          default:
            return 0;
        }
      });
  }, [packages, searchQuery, selectedCategory, sortBy]);

  // Apply promo code
  const applyPromo = useCallback(async (): Promise<boolean> => {
    try {
      const code = promoCode.trim().toUpperCase();
      if (!code) {
        setPromoDiscount(0);
        return false;
      }

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setPromoDiscount(0);
        return false;
      }

      const subtotal = cart.reduce((sum, item) => sum + item.package.priceUsd * item.quantity, 0);
      if (subtotal <= 0) {
        setPromoDiscount(0);
        return false;
      }

      const { data: promo, error } = await fromExtended("dlc_promo_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !promo) {
        setPromoDiscount(0);
        return false;
      }

      const now = Date.now();
      const promoRecord = promo as Record<string, unknown>;

      // Support both promo code schemas present in migrations.
      const startsAtRaw = promoRecord.valid_from ?? promoRecord.starts_at ?? promoRecord.created_at ?? null;
      const expiresAtRaw = promoRecord.valid_until ?? promoRecord.expires_at ?? null;
      const startsAt = startsAtRaw ? new Date(String(startsAtRaw)).getTime() : now;
      const expiresAt = expiresAtRaw ? new Date(String(expiresAtRaw)).getTime() : null;
      if (startsAt > now || (expiresAt != null && expiresAt <= now)) {
        setPromoDiscount(0);
        return false;
      }

      const max = promoRecord.max_redemptions ?? promoRecord.max_uses ?? null;
      const current = promoRecord.current_redemptions ?? promoRecord.current_uses ?? 0;
      const maxUses = max != null ? Number(max) : null;
      const currentUses = current != null ? Number(current) : 0;
      if (maxUses != null && currentUses >= maxUses) {
        setPromoDiscount(0);
        return false;
      }

      const appliesTo: string[] = Array.isArray(promoRecord.applies_to)
        ? (promoRecord.applies_to as unknown[]).map((x: unknown) => String(x).toUpperCase())
        : [];
      const cartPackageIds = cart.map(ci => ci.package.packageId.toUpperCase());
      const appliesToAll =
        promoRecord.applies_to_all === true ||
        appliesTo.includes("*") ||
        appliesTo.includes("ALL") ||
        appliesTo.includes("ANY");

      // Some legacy schemas store pack/bundle UUIDs instead of package IDs.
      // If we can't safely match, fall back to applies_to_all.
      const appliesAnyCart =
        appliesToAll ||
        (appliesTo.length > 0 && cartPackageIds.some(pid => appliesTo.includes(pid)));
      if (!appliesAnyCart) {
        setPromoDiscount(0);
        return false;
      }

      const maxPerUserRaw = promoRecord.max_per_user ?? promoRecord.max_uses_per_user ?? 1;
      const maxPerUser = Number(maxPerUserRaw);
      if (maxPerUser > 0) {
        // Support either redemption table name: dlc_promo_redemptions OR dlc_promo_code_usage
        let count = 0;
        try {
          const res = await fromExtended("dlc_promo_redemptions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", auth.user.id)
            .eq("promo_code_id", promoRecord.id);
          count = Number(res.count ?? 0);
        } catch {
          try {
            const res = await fromExtended("dlc_promo_code_usage")
              .select("id", { count: "exact", head: true })
              .eq("user_id", auth.user.id)
              .eq("promo_code_id", promoRecord.id);
            count = Number(res.count ?? 0);
          } catch {
            // ignore
          }
        }
        if (count >= maxPerUser) {
          setPromoDiscount(0);
          return false;
        }
      }

      const minPurchase = promoRecord.min_purchase_amount != null ? Number(promoRecord.min_purchase_amount) : 0;
      if (Number.isFinite(minPurchase) && minPurchase > 0 && subtotal < minPurchase) {
        setPromoDiscount(0);
        return false;
      }

      const discountType = String(promoRecord.discount_type ?? "").toLowerCase();
      const discountValue = Number(promoRecord.discount_value ?? 0);
      let percent = 0;
      if (discountType === "percentage") {
        percent = Math.max(0, Math.min(100, discountValue));
      } else if (discountType === "fixed" || discountType === "fixed_amount") {
        percent = subtotal > 0 ? (Math.max(0, discountValue) / subtotal) * 100 : 0;
        percent = Math.max(0, Math.min(100, percent));
      } else if (discountType === "free" || discountType === "free_trial") {
        percent = 100;
      } else {
        setPromoDiscount(0);
        return false;
      }

      setPromoDiscount(percent);
      try {
        window.localStorage.setItem(PROMO_STORAGE_KEY, code);
      } catch {
        // ignore
      }
      return percent > 0;
    } catch {
      setPromoDiscount(0);
      return false;
    }
  }, [promoCode, cart]);

  return {
    cart,
    cartTotal,
    addToCart,
    removeFromCart,
    clearCart,
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    filteredPackages,
    promoCode,
    setPromoCode,
    promoDiscount,
    applyPromo,
  };
}

export default useDLCStore;
