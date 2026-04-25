/**
 * Single source of truth for feature → plan tier mapping.
 *
 * Resolution order in hasFeature():
 *   1. restaurant.plan_overrides[key] — explicit override wins
 *   2. PLAN_FEATURES[restaurant.current_plan][key] — plan default
 *   3. false — unknown plan or unknown feature
 *
 * Adding a new feature:
 *   1. Add key + boolean to each plan tier below
 *   2. Use hasFeature(restaurant, 'new_key') in components
 *   3. Super admin can override per-restaurant via plan_overrides JSONB
 */

export type PlanTier = 'basic' | 'premium' | 'enterprise';

export type FeatureKey =
  // Pillar 1: SEO
  | 'menu_item_schema'
  | 'hreflang_tags'
  | 'sitemap_inclusion'
  | 'custom_domain'
  // Pillar 2: GEO
  | 'directions_cta'
  | 'geo_schema'
  | 'google_reviews_redirect'
  // Pillar 3: Social
  | 'social_icons'
  | 'instagram_feed'
  | 'follow_for_discount'
  | 'referral_share'
  // Pillar 4: CRM / direct relationship
  | 'customer_crud'
  | 'device_memory'
  | 'likes'
  | 'order_history_splash'
  | 'returning_visitor_ui'
  | 'cross_device_phone'
  | 'birthday_campaign'
  | 'loyalty_stamp'
  | 'whatsapp_marketing'
  | 'sms_marketing'
  // Operational
  | 'cart'
  | 'whatsapp_order'
  | 'feedback'
  | 'discount_codes'
  | 'multi_currency'
  | 'waiter_calls'
  | 'feedback_form'
  | 'local_seo';

export const PLAN_FEATURES: Record<PlanTier, Record<FeatureKey, boolean>> = {
  basic: {
    // SEO
    menu_item_schema: true,
    hreflang_tags: true,
    sitemap_inclusion: true,
    custom_domain: false,
    // GEO
    directions_cta: true,
    geo_schema: false,
    google_reviews_redirect: false,
    // Social
    social_icons: true,
    instagram_feed: false,
    follow_for_discount: false,
    referral_share: false,
    // CRM
    customer_crud: true,
    device_memory: true,
    likes: false,
    order_history_splash: false,
    returning_visitor_ui: false,
    cross_device_phone: false,
    birthday_campaign: false,
    loyalty_stamp: false,
    whatsapp_marketing: false,
    sms_marketing: false,
    // Operational
    cart: true,
    whatsapp_order: true,
    feedback: true,
    discount_codes: false,
    multi_currency: false,
    waiter_calls: false,
    feedback_form: true,
    local_seo: true,
  },
  premium: {
    menu_item_schema: true,
    hreflang_tags: true,
    sitemap_inclusion: true,
    custom_domain: false,
    directions_cta: true,
    geo_schema: true,
    google_reviews_redirect: true,
    social_icons: true,
    instagram_feed: true,
    follow_for_discount: false,
    referral_share: false,
    customer_crud: true,
    device_memory: true,
    likes: true,
    order_history_splash: true,
    returning_visitor_ui: true,
    cross_device_phone: false,
    birthday_campaign: false,
    loyalty_stamp: false,
    whatsapp_marketing: false,
    sms_marketing: false,
    cart: true,
    whatsapp_order: true,
    feedback: true,
    discount_codes: true,
    multi_currency: true,
    waiter_calls: true,
    feedback_form: true,
    local_seo: true,
  },
  enterprise: {
    menu_item_schema: true,
    hreflang_tags: true,
    sitemap_inclusion: true,
    custom_domain: true,
    directions_cta: true,
    geo_schema: true,
    google_reviews_redirect: true,
    social_icons: true,
    instagram_feed: true,
    follow_for_discount: true,
    referral_share: true,
    customer_crud: true,
    device_memory: true,
    likes: true,
    order_history_splash: true,
    returning_visitor_ui: true,
    cross_device_phone: true,
    birthday_campaign: true,
    loyalty_stamp: true,
    whatsapp_marketing: true,
    sms_marketing: true,
    cart: true,
    whatsapp_order: true,
    feedback: true,
    discount_codes: true,
    multi_currency: true,
    waiter_calls: true,
    feedback_form: true,
    local_seo: true,
  },
};

export interface RestaurantFeatureContext {
  current_plan?: string | null;
  plan_overrides?: Record<string, boolean> | null;
}

export function hasFeature(
  restaurant: RestaurantFeatureContext | null | undefined,
  key: FeatureKey
): boolean {
  if (!restaurant) return false;

  const overrides = restaurant.plan_overrides ?? {};
  if (key in overrides) {
    return overrides[key] === true;
  }

  const plan = (restaurant.current_plan ?? 'basic') as PlanTier;
  const planMap = PLAN_FEATURES[plan];
  if (planMap && key in planMap) {
    return planMap[key];
  }

  return false;
}

export function getEnabledFeatures(
  restaurant: RestaurantFeatureContext | null | undefined
): FeatureKey[] {
  if (!restaurant) return [];
  const allKeys = Object.keys(PLAN_FEATURES.enterprise) as FeatureKey[];
  return allKeys.filter((key) => hasFeature(restaurant, key));
}
