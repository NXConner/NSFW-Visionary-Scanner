import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { MarketplaceItem, MarketplacePurchase } from "./types";
import { getMarketplaceItem } from "./items";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = { from: (t: string) => fromExtended(t as any) };

function isPurchaseActive(p: MarketplacePurchase): boolean {
  if (!p.is_active) return false;
  if (!p.access_expires_at) return true;
  return new Date(p.access_expires_at).getTime() > Date.now();
}

function checkoutSuccessUrl(itemId: string): string {
  const origin = window.location.origin;
  return `${origin}/marketplace?purchase=success&item=${encodeURIComponent(itemId)}`;
}

function checkoutCancelUrl(itemId: string): string {
  const origin = window.location.origin;
  return `${origin}/marketplace?purchase=cancel&item=${encodeURIComponent(itemId)}`;
}

export async function purchaseMarketplaceItem(itemId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to purchase items");
      return false;
    }

    const item = await getMarketplaceItem(itemId);
    if (!item) {
      toast.error("Item not found");
      return false;
    }

    const alreadyOwns = await userOwnsItem(itemId);
    if (alreadyOwns) {
      toast.info("You already own this item");
      return true;
    }

    const isFree = Boolean(item.is_free || Number(item.price) === 0);
    if (isFree) {
      const now = new Date().toISOString();
      const purchaseType = item.is_subscription ? "subscription" : "one_time";
      const expiresAt =
        item.is_subscription && item.subscription_duration_days
          ? new Date(
              Date.now() + Number(item.subscription_duration_days) * 24 * 60 * 60 * 1000,
            ).toISOString()
          : null;

      const { error } = await db.from("marketplace_purchases").insert({
        item_id: itemId,
        user_id: user.id,
        purchase_type: purchaseType,
        price_paid: 0,
        payment_intent_id: null,
        access_granted_at: now,
        access_expires_at: expiresAt,
        is_active: true,
        purchased_at: now,
      });

      if (error) {
        logger.error("Failed to insert marketplace purchase", { error: error.message, itemId });
        toast.error("Failed to add item to library");
        return false;
      }

      // Best-effort counters
      try {
        await db
          .from("marketplace_items")
          .update({
            purchase_count: (item.purchase_count ?? 0) + 1,
            revenue_total: Number(item.revenue_total ?? 0),
            updated_at: now,
          })
          .eq("id", itemId);
      } catch {
        // ignore
      }

      toast.success("Item added to your library!");
      return true;
    }

    // Paid checkout: use Stripe session + webhook to grant access.
    toast.info("Redirecting to checkout…");
    const { data, error } = await supabase.functions.invoke("create-marketplace-checkout-session", {
      body: {
        itemId,
        successUrl: checkoutSuccessUrl(itemId),
        cancelUrl: checkoutCancelUrl(itemId),
      },
    });

    if (error || !data?.url) {
      const msg = error?.message || data?.error || "Checkout is not configured";
      toast.error(msg);
      return false;
    }

    window.location.assign(String(data.url));
    return true;
  } catch (err) {
    logger.error("Error purchasing item", { error: err });
    toast.error("Failed to complete purchase");
    return false;
  }
}

export async function getUserPurchases(): Promise<MarketplacePurchase[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await db
      .from("marketplace_purchases")
      .select("*")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false })
      .limit(200);

    if (error) {
      logger.error("Error getting user purchases", { error: error.message });
      return [];
    }

    return (data ?? []) as MarketplacePurchase[];
  } catch (err) {
    logger.error("Error getting user purchases", { error: err });
    return [];
  }
}

export async function userOwnsItem(itemId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await db
      .from("marketplace_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .order("purchased_at", { ascending: false })
      .limit(10);

    if (error) {
      logger.error("Error checking ownership", { error: error.message, itemId });
      return false;
    }

    const purchases = (data ?? []) as MarketplacePurchase[];
    return purchases.some(isPurchaseActive);
  } catch (err) {
    logger.error("Error checking ownership", { error: err, itemId });
    return false;
  }
}

export function getMarketplaceItemPriceLabel(
  item: Pick<MarketplaceItem, "is_free" | "price" | "currency">,
): string {
  if (item.is_free || Number(item.price) === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: item.currency || "USD",
  }).format(Number(item.price));
}
