import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tabbled.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COOLDOWN_MS = 72 * 60 * 60 * 1000; // 72 hours

// Google's day numbering (0=Sunday) → our 3-letter lowercase keys (matches DAY_KEYS in dashboardShared)
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface GoogleTimePoint {
  day?: number;
  hour?: number;
  minute?: number;
}

interface GooglePeriod {
  open?: GoogleTimePoint;
  close?: GoogleTimePoint;
}

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Map Google's regularOpeningHours.periods[] to our 7-day JSONB schema.
 * - Days not present in periods → marked closed
 * - 24h operations (no close time) → 00:00 - 23:59
 * - Multi-period days → first period kept, others logged + dropped
 * - Returns null when periods is missing/invalid (caller leaves manual hours untouched)
 */
function normalizeWorkingHours(
  periods: GooglePeriod[] | undefined,
): Record<string, DaySchedule> | null {
  if (!periods || !Array.isArray(periods)) return null;

  const out: Record<string, DaySchedule> = {};
  for (const key of DAY_KEYS) {
    out[key] = { open: "", close: "", closed: true };
  }

  const seenDays = new Set<number>();
  for (const period of periods) {
    const dayNum = period.open?.day;
    if (typeof dayNum !== "number" || dayNum < 0 || dayNum > 6) continue;

    if (seenDays.has(dayNum)) {
      console.warn(
        `[fetch-google-rating] multi-period day=${dayNum} — keeping first period only`,
      );
      continue;
    }
    seenDays.add(dayNum);

    const key = DAY_KEYS[dayNum];
    const openH = period.open?.hour ?? 0;
    const openM = period.open?.minute ?? 0;
    const openStr = `${pad2(openH)}:${pad2(openM)}`;

    if (!period.close) {
      // 24h operation: Google omits close
      out[key] = { open: "00:00", close: "23:59", closed: false };
    } else {
      const closeH = period.close.hour ?? 0;
      const closeM = period.close.minute ?? 0;
      const closeStr = `${pad2(closeH)}:${pad2(closeM)}`;
      out[key] = { open: openStr, close: closeStr, closed: false };
    }
  }

  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { restaurant_id, google_place_id } = await req.json();

    if (!restaurant_id || !google_place_id) {
      return new Response(
        JSON.stringify({
          error: "no_place_id",
          message: "restaurant_id ve google_place_id gerekli",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Places API key yapılandırılmamış" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 72-hour cooldown — defense in depth (UI also enforces; check here so direct API hits can't bypass)
    const { data: existing, error: fetchExistingError } = await supabase
      .from("restaurants")
      .select("google_rating_updated_at")
      .eq("id", restaurant_id)
      .single();

    if (fetchExistingError) {
      console.error("Failed to read restaurant for cooldown check:", fetchExistingError);
      return new Response(
        JSON.stringify({ error: "Restoran bulunamadı" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (existing?.google_rating_updated_at) {
      const lastFetched = new Date(existing.google_rating_updated_at).getTime();
      const elapsedMs = Date.now() - lastFetched;

      if (elapsedMs < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsedMs;
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
        return new Response(
          JSON.stringify({
            error: "cooldown_active",
            remaining_hours: remainingHours,
            next_available_at: new Date(lastFetched + COOLDOWN_MS).toISOString(),
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Places API (New) — full FieldMask: address + phone + hours + location + rating
    const placesUrl = `https://places.googleapis.com/v1/places/${google_place_id}`;
    const fieldMask =
      "displayName,formattedAddress,internationalPhoneNumber,nationalPhoneNumber,regularOpeningHours,location,rating,userRatingCount";
    const placesResponse = await fetch(placesUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
    });

    if (!placesResponse.ok) {
      const errorText = await placesResponse.text();
      console.error("Google Places API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "google_api_failed",
          message: errorText,
          google_status: placesResponse.status,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const placesData = await placesResponse.json();

    // Phone preference: nationalPhoneNumber matches Turkish customer expectation; fall back to international.
    const phone =
      placesData.nationalPhoneNumber ?? placesData.internationalPhoneNumber ?? null;
    const address = placesData.formattedAddress ?? null;
    const workingHours = normalizeWorkingHours(
      placesData.regularOpeningHours?.periods,
    );
    const latitude = placesData.location?.latitude ?? null;
    const longitude = placesData.location?.longitude ?? null;
    const rating = placesData.rating ?? null;
    const reviewCount = placesData.userRatingCount ?? 0;

    const nowIso = new Date().toISOString();
    const nextAvailableAt = new Date(Date.now() + COOLDOWN_MS).toISOString();

    // Build update payload — only include fields Google actually returned, so missing
    // values don't blow away manual data. google_rating_updated_at always advances so
    // the cooldown ticks even on partial responses.
    const updatePayload: Record<string, unknown> = {
      google_rating_updated_at: nowIso,
    };
    if (address) updatePayload.address = address;
    if (phone) updatePayload.phone = phone;
    if (workingHours) updatePayload.working_hours = workingHours;
    if (latitude !== null) updatePayload.latitude = latitude;
    if (longitude !== null) updatePayload.longitude = longitude;
    if (rating !== null) {
      updatePayload.google_rating = rating;
      updatePayload.google_review_count = reviewCount;
    }

    const { error: updateError } = await supabase
      .from("restaurants")
      .update(updatePayload)
      .eq("id", restaurant_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      return new Response(
        JSON.stringify({ error: "DB güncelleme hatası" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: {
          address,
          phone,
          working_hours: workingHours,
          latitude,
          longitude,
          google_rating: rating,
          google_review_count: reviewCount,
        },
        next_available_at: nextAvailableAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Beklenmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
