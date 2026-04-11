// Tabbled — contact form → Resend email to info@tabbled.com
// Deploy: supabase functions deploy contact-form --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt

import { Resend } from 'npm:resend@2.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { name, restaurant, phone, email, message, selectedPlan } = body as {
      name?: string
      restaurant?: string
      phone?: string
      email?: string
      message?: string
      selectedPlan?: string
    }

    if (!name || !restaurant || !phone) {
      return new Response(
        JSON.stringify({ error: 'İsim, restoran adı ve telefon zorunludur.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (name.length > 200 || restaurant.length > 200 || phone.length > 40 || (message && message.length > 1000)) {
      return new Response(
        JSON.stringify({ error: 'Alanlar izin verilen uzunluğu aşıyor.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Persist submission to the database first so data is not lost if Resend fails.
    // Failures here are logged but do NOT block the email response — the email is
    // still the primary delivery channel.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        const { error: insertError } = await supabaseAdmin.from('contact_submissions').insert({
          name,
          restaurant_name: restaurant,
          phone,
          email: email || null,
          message: message || null,
          selected_plan: selectedPlan || null,
        })
        if (insertError) console.error('contact_submissions insert error:', insertError)
      } catch (dbErr) {
        console.error('contact_submissions insert threw:', dbErr)
      }
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not set')
      return new Response(
        JSON.stringify({ error: 'Email servisi yapılandırılmamış.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const resend = new Resend(resendApiKey)

    const html = `
      <h2 style="font-family:Inter,Arial,sans-serif;color:#1C1C1E;">Yeni Demo Talebi</h2>
      <table style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#2D2D2F;border-collapse:collapse;">
        <tr><td style="padding:4px 8px;"><strong>İsim:</strong></td><td style="padding:4px 8px;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:4px 8px;"><strong>Restoran:</strong></td><td style="padding:4px 8px;">${escapeHtml(restaurant)}</td></tr>
        <tr><td style="padding:4px 8px;"><strong>Telefon:</strong></td><td style="padding:4px 8px;">${escapeHtml(phone)}</td></tr>
        ${email ? `<tr><td style="padding:4px 8px;"><strong>E-posta:</strong></td><td style="padding:4px 8px;">${escapeHtml(email)}</td></tr>` : ''}
        ${selectedPlan ? `<tr><td style="padding:4px 8px;"><strong>Seçilen Plan:</strong></td><td style="padding:4px 8px;">${escapeHtml(selectedPlan)}</td></tr>` : ''}
        ${message ? `<tr><td style="padding:4px 8px;vertical-align:top;"><strong>Mesaj:</strong></td><td style="padding:4px 8px;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>` : ''}
      </table>
      <hr style="border:none;border-top:1px solid #E5E5E3;margin:16px 0;" />
      <p style="font-family:Inter,Arial,sans-serif;color:#6B6B6F;font-size:12px;">
        Bu email tabbled.com iletişim formundan otomatik gönderilmiştir.
      </p>
    `

    const sendResult = await resend.emails.send({
      from: 'Tabbled <noreply@tabbled.com>',
      to: 'info@tabbled.com',
      replyTo: email || undefined,
      subject: `Yeni Demo Talebi — ${restaurant}`,
      html,
    })

    if ((sendResult as { error?: unknown }).error) {
      console.error('Resend error:', (sendResult as { error: unknown }).error)
      return new Response(
        JSON.stringify({ error: 'Mesaj gönderilemedi. Lütfen WhatsApp ile ulaşın.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Contact form error:', err)
    return new Response(
      JSON.stringify({ error: 'Mesaj gönderilemedi. Lütfen WhatsApp ile ulaşın.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
