import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Blog slug'ları (src/lib/blogData.ts ile senkron)
const BLOG_SLUGS = [
  'qr-menu-zorunlulugu-2026',
  'qr-menu-nedir',
  'qr-menu-fiyatlari-2026',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (error) throw error

    const today = new Date().toISOString().split('T')[0]

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tabbled.com</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tabbled.com/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://tabbled.com/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`

    for (const slug of BLOG_SLUGS) {
      xml += `
  <url>
    <loc>https://tabbled.com/blog/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    }

    if (restaurants) {
      for (const r of restaurants) {
        const lastmod = r.updated_at
          ? new Date(r.updated_at).toISOString().split('T')[0]
          : today
        xml += `
  <url>
    <loc>https://tabbled.com/menu/${r.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
      }
    }

    xml += `
</urlset>`

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Sitemap error:', err)
    return new Response('Sitemap generation error', { status: 500 })
  }
})
