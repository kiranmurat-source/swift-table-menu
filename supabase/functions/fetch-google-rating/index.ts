import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tabbled.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COOLDOWN_MS = 72 * 60 * 60 * 1000; // 72 hours

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { restaurant_id, google_place_id } = await req.json();

    if (!restaurant_id || !google_place_id) {
      return new Response(
        JSON.stringify({ error: "restaurant_id ve google_place_id gerekli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Places API key yapılandırılmamış" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 72-hour cooldown — defense in depth (UI also enforces, but check here so direct API hits can't bypass)
    const { data: existing, error: fetchExistingError } = await supabase
      .from("restaurants")
      .select("google_rating_updated_at")
      .eq("id", restaurant_id)
      .single();

    if (fetchExistingError) {
      console.error("Failed to read restaurant for cooldown check:", fetchExistingError);
      return new Response(
        JSON.stringify({ error: "Restoran bulunamadı" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Places API (New) — rating, review count + location (lat/lng)
    const placesUrl = `https://places.googleapis.com/v1/places/${google_place_id}`;
    const placesResponse = await fetch(placesUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "rating,userRatingCount,location",
      },
    });

    if (!placesResponse.ok) {
      const errorText = await placesResponse.text();
      console.error("Google Places API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Google Places API hatası", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const placesData = await placesResponse.json();
    const rating = placesData.rating ?? null;
    const reviewCount = placesData.userRatingCount ?? 0;
    const latitude = placesData.location?.latitude ?? null;
    const longitude = placesData.location?.longitude ?? null;

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({
        google_rating: rating,
        google_review_count: reviewCount,
        latitude,
        longitude,
        google_rating_updated_at: new Date().toISOString(),
      })
      .eq("id", restaurant_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      return new Response(
        JSON.stringify({ error: "DB güncelleme hatası" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        rating,
        review_count: reviewCount,
        latitude,
        longitude,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Beklenmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
