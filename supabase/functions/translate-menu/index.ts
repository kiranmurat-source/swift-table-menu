import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_TRANSLATE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Map internal language codes to Google Translate API codes where they
// differ. Any language not listed here is passed through unchanged.
const GOOGLE_LANG_CODES: Record<string, string> = {
  zh: "zh-CN",
};

const MENU_GLOSSARY: Record<string, Record<string, string>> = {
  "Başlangıç": { en: "Starters", ar: "المقبلات", zh: "开胃菜" },
  "Başlangıçlar": { en: "Starters", ar: "المقبلات", zh: "开胃菜" },
  "Ana Yemekler": { en: "Main Courses", ar: "الأطباق الرئيسية", zh: "主菜" },
  "Ana Yemek": { en: "Main Course", ar: "الطبق الرئيسي", zh: "主菜" },
  "Salatalar": { en: "Salads", ar: "السلطات", zh: "沙拉" },
  "Çorbalar": { en: "Soups", ar: "الشوربات", zh: "汤类" },
  "Tatlılar": { en: "Desserts", ar: "الحلويات", zh: "甜点" },
  "İçecekler": { en: "Beverages", ar: "المشروبات", zh: "饮品" },
  "Sıcak İçecekler": { en: "Hot Beverages", ar: "المشروبات الساخنة", zh: "热饮" },
  "Soğuk İçecekler": { en: "Cold Beverages", ar: "المشروبات الباردة", zh: "冷饮" },
  "Kahvaltı": { en: "Breakfast", ar: "الفطور", zh: "早餐" },
  "Pideler": { en: "Pide", ar: "البيدا", zh: "土耳其披萨" },
  "Izgara": { en: "Grills", ar: "المشويات", zh: "烧烤" },
  "Izgaralar": { en: "Grills", ar: "المشويات", zh: "烧烤" },
  "Kebaplar": { en: "Kebabs", ar: "الكباب", zh: "烤肉串" },
  "Mezeler": { en: "Mezes", ar: "المزات", zh: "开胃小菜" },
  "Ara Sıcaklar": { en: "Hot Appetizers", ar: "المقبلات الساخنة", zh: "热前菜" },
  "Makarnalar": { en: "Pasta", ar: "المعكرونة", zh: "意面" },
  "Burgerler": { en: "Burgers", ar: "البرغر", zh: "汉堡" },
  "Sandviçler": { en: "Sandwiches", ar: "السندويشات", zh: "三明治" },
  "Atıştırmalıklar": { en: "Snacks", ar: "الوجبات الخفيفة", zh: "小吃" },
  "Yan Lezzetler": { en: "Side Dishes", ar: "الأطباق الجانبية", zh: "配菜" },
  "Deniz Ürünleri": { en: "Seafood", ar: "المأكولات البحرية", zh: "海鲜" },
  "Kokteyl": { en: "Cocktails", ar: "الكوكتيلات", zh: "鸡尾酒" },
  "Kokteyller": { en: "Cocktails", ar: "الكوكتيلات", zh: "鸡尾酒" },
};

async function translateText(text: string, lang: string): Promise<string> {
  const glossaryMatch = MENU_GLOSSARY[text.trim()];
  if (glossaryMatch && glossaryMatch[lang]) {
    return glossaryMatch[lang];
  }

  const googleLang = GOOGLE_LANG_CODES[lang] || lang;
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "tr", target: googleLang, format: "text" }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Translation failed");
  return data.data.translations[0].translatedText;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  try {
    const { table, record_id, languages } = await req.json();

    if (!table || !record_id || !languages || languages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: record, error: fetchErr } = await supabase
      .from(table)
      .select("*")
      .eq("id", record_id)
      .single();

    if (fetchErr || !record) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const translations: Record<string, Record<string, string>> = record.translations || {};

    const fieldsToTranslate: string[] = [];
    if (table === "menu_items") fieldsToTranslate.push("name", "description");
    else if (table === "menu_categories") fieldsToTranslate.push("name", "description");
    else if (table === "restaurants") fieldsToTranslate.push("description", "tagline");

    for (const lang of languages) {
      if (lang === "tr") continue; // source language, skip
      translations[lang] = translations[lang] || {};

      for (const field of fieldsToTranslate) {
        const sourceText = record[`${field}_tr`] || record[field];
        if (!sourceText || sourceText.trim() === "") continue;
        translations[lang][field] = await translateText(sourceText, lang);
      }
    }

    const { error: updateErr } = await supabase
      .from(table)
      .update({ translations })
      .eq("id", record_id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify({ success: true, translations }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
