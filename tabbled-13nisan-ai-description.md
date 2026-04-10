# TABBLED — AI Menü Açıklaması Yazıcı
# Supabase Edge Function + Admin Panel Entegrasyonu

---

## PROJE BAĞLAMI

- **Dizin:** /opt/khp/tabbled
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **İkon:** Circum Icons (react-icons/ci)
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Mevcut Edge Functions:** create-user (JWT), translate-menu (no-verify-jwt)
- **Anthropic API Key:** Supabase secrets'ta `ANTHROPIC_API_KEY` olarak ayarlandı
- **Model:** claude-haiku-4-5-20251001 (hızlı, ucuz, menü açıklaması için yeterli)

---

## GENEL BAKIŞ

Restoran sahibi admin panelde ürün formunda "AI ile Açıklama Yaz" butonuna basar. AI, ürün adı + kategori + fiyat + allerjenler + varsa mevcut açıklamadan yola çıkarak profesyonel, iştah açıcı bir Türkçe açıklama üretir. Sadece Türkçe — diğer diller çeviri merkezinden otomatik çevrilir.

### Akış:
1. Kullanıcı ürün formunda "AI ile Açıklama Yaz" butonuna tıklar
2. Frontend → Edge Function'a istek atar (ürün bilgileri)
3. Edge Function → Anthropic API (Claude Haiku) çağırır
4. Üretilen açıklama → frontend'e döner
5. Kullanıcı önizler, beğenirse description_tr alanına yapıştırılır
6. Kullanıcı düzenleyebilir veya tekrar üretebilir

---

## GÖREV 1: EDGE FUNCTION — generate-description

### Dosya: supabase/functions/generate-description/index.ts

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const { 
      itemName,        // Ürün adı (zorunlu)
      categoryName,    // Kategori adı (opsiyonel)
      price,           // Fiyat (opsiyonel)
      allergens,       // Allerjen listesi (opsiyonel, string[])
      currentDesc,     // Mevcut açıklama (opsiyonel — varsa iyileştir)
      tone,            // Ton: 'elegant' | 'casual' | 'descriptive' (varsayılan: 'descriptive')
    } = await req.json();

    if (!itemName || itemName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ürün adı gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ton açıklaması
    const toneGuide: Record<string, string> = {
      elegant: 'Şık, rafine, lüks restoran tarzında. Kısa ve etkileyici.',
      casual: 'Samimi, sıcak, kafe/bistro tarzında. Arkadaşça ve davetkar.',
      descriptive: 'Detaylı, bilgilendirici, malzemeleri ve pişirme tekniğini anlatan.',
    };

    const selectedTone = toneGuide[tone] || toneGuide['descriptive'];

    // Prompt oluştur
    const systemPrompt = `Sen profesyonel bir restoran menü yazarısın. Türkiye'deki restoranlar için iştah açıcı, profesyonel menü açıklamaları yazıyorsun.

Kurallar:
- SADECE Türkçe yaz
- 1-3 cümle (40-120 karakter arası ideal, max 200 karakter)
- İştah açıcı, duygusal, görsel imgeler kullan
- Malzemeleri, pişirme tekniğini veya sunumu vurgula
- Abartma, klişe ifadelerden kaçın ("eşsiz", "muhteşem", "benzersiz" gibi)
- Emoji KULLANMA
- Fiyat veya kalori bilgisi YAZMA (bunlar zaten ayrı gösteriliyor)
- HTML tag'i KULLANMA, düz metin yaz
- Allerjen bilgisi YAZMA (bunlar zaten ayrı gösteriliyor)
- Restoran adı YAZMA
- Sadece açıklama metnini döndür, başka hiçbir şey yazma`;

    let userPrompt = `Ürün: ${itemName}`;
    if (categoryName) userPrompt += `\nKategori: ${categoryName}`;
    if (price) userPrompt += `\nFiyat: ${price} ₺`;
    if (allergens && allergens.length > 0) userPrompt += `\nAllerjenler: ${allergens.join(', ')}`;
    if (currentDesc && currentDesc.trim().length > 0) {
      userPrompt += `\nMevcut açıklama (bunu iyileştir): ${currentDesc}`;
    }
    userPrompt += `\n\nTon: ${selectedTone}`;
    userPrompt += `\n\nBu ürün için kısa, iştah açıcı bir menü açıklaması yaz.`;

    // Anthropic API çağrısı
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.content?.[0]?.text?.trim() || '';

    if (!generatedText) {
      throw new Error('Boş yanıt alındı');
    }

    return new Response(
      JSON.stringify({ 
        description: generatedText,
        usage: {
          input_tokens: data.usage?.input_tokens || 0,
          output_tokens: data.usage?.output_tokens || 0,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate description error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Bir hata oluştu' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Deploy komutu (Claude Code bunu çalıştırsın):
```bash
# Edge function dizini oluştur
mkdir -p supabase/functions/generate-description

# index.ts dosyasını oluştur (yukarıdaki kod)
# ...

# Deploy et
supabase functions deploy generate-description --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

**NOT:** `--no-verify-jwt` kullanıyoruz çünkü Edge Function'ın kendisi auth kontrolü yapmıyor. İleride JWT doğrulaması eklenebilir ama şimdilik basit tutalım — zaten admin panelden çağrılıyor.

---

## GÖREV 2: ADMIN PANEL — AI AÇIKLAMA BUTONU

### Konum:
RestaurantDashboard'daki ürün formunda, description_tr alanının yanına/üstüne "AI ile Açıklama Yaz" butonu ekle.

### Uygulama:

#### 1. Ürün formundaki description_tr alanını bul

Muhtemelen inline akordeon formda bir textarea veya Rich Text Editor (Tiptap) var. Bu alanın hemen üstüne buton ekle.

#### 2. AI Açıklama Butonu:

```tsx
import { CiWand1 } from 'react-icons/ci';

// State
const [aiGenerating, setAiGenerating] = useState(false);
const [aiPreview, setAiPreview] = useState<string | null>(null);
const [aiTone, setAiTone] = useState<'elegant' | 'casual' | 'descriptive'>('descriptive');

const generateDescription = async () => {
  if (aiGenerating) return;
  if (!itemForm.name_tr || itemForm.name_tr.trim().length === 0) {
    // Toast veya alert: "Önce ürün adını girin"
    return;
  }

  setAiGenerating(true);
  setAiPreview(null);

  try {
    // Kategori adını bul
    const category = categories.find(c => c.id === itemForm.category_id);
    const categoryName = category?.name_tr || '';

    const response = await fetch(
      'https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/generate-description',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey, // veya import edilen key
        },
        body: JSON.stringify({
          itemName: itemForm.name_tr,
          categoryName,
          price: itemForm.price,
          allergens: itemForm.allergens || [],
          currentDesc: itemForm.description_tr || '',
          tone: aiTone,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Önizleme olarak göster (henüz form'a yazma)
    setAiPreview(data.description);

  } catch (error) {
    console.error('AI açıklama hatası:', error);
    alert('AI açıklama oluşturulamadı. Lütfen tekrar deneyin.');
  } finally {
    setAiGenerating(false);
  }
};

// Önizlemeyi kabul et → form'a yaz
const acceptAiDescription = () => {
  if (aiPreview) {
    setItemForm(prev => ({ ...prev, description_tr: aiPreview }));
    setAiPreview(null);
    // Rich text editör kullanılıyorsa, editör içeriğini de güncelle
    // editor?.commands.setContent(aiPreview) gibi
  }
};

// Tekrar üret
const regenerateDescription = () => {
  generateDescription();
};
```

#### 3. UI Yerleşimi:

Description_tr alanının hemen üstüne şu bloğu ekle:

```tsx
{/* AI Açıklama Yazıcı */}
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '8px',
}}>
  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1C1C1E' }}>
    Açıklama (TR)
  </label>
  
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    {/* Ton seçici (küçük dropdown) */}
    <select
      value={aiTone}
      onChange={e => setAiTone(e.target.value as any)}
      style={{
        fontSize: '11px',
        padding: '4px 8px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        color: '#6b7280',
        cursor: 'pointer',
      }}
    >
      <option value="descriptive">Detaylı</option>
      <option value="elegant">Şık</option>
      <option value="casual">Samimi</option>
    </select>
    
    {/* AI Buton */}
    <button
      type="button"
      onClick={generateDescription}
      disabled={aiGenerating || !itemForm.name_tr}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '6px',
        border: 'none',
        backgroundColor: aiGenerating ? '#e5e7eb' : '#FF4F7A',
        color: aiGenerating ? '#999' : '#fff',
        cursor: aiGenerating ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {aiGenerating ? (
        <>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid #fff',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }} />
          Yazılıyor...
        </>
      ) : (
        <>
          <CiWand1 size={14} />
          AI ile Yaz
        </>
      )}
    </button>
  </div>
</div>

{/* AI Önizleme (üretildikten sonra göster) */}
{aiPreview && (
  <div style={{
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '8px',
    border: '1px solid #FF4F7A40',
    backgroundColor: '#FFF5F7',
  }}>
    <div style={{
      fontSize: '12px',
      fontWeight: 600,
      color: '#FF4F7A',
      marginBottom: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      <CiWand1 size={12} />
      AI Önizleme
    </div>
    <div style={{
      fontSize: '13px',
      color: '#1C1C1E',
      lineHeight: 1.5,
      marginBottom: '8px',
    }}>
      {aiPreview}
    </div>
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        type="button"
        onClick={acceptAiDescription}
        style={{
          padding: '4px 12px',
          fontSize: '11px',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#22c55e',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Kullan
      </button>
      <button
        type="button"
        onClick={regenerateDescription}
        style={{
          padding: '4px 12px',
          fontSize: '11px',
          fontWeight: 600,
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          color: '#666',
          cursor: 'pointer',
        }}
      >
        Tekrar Üret
      </button>
      <button
        type="button"
        onClick={() => setAiPreview(null)}
        style={{
          padding: '4px 12px',
          fontSize: '11px',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#999',
          cursor: 'pointer',
        }}
      >
        İptal
      </button>
    </div>
  </div>
)}

{/* Mevcut description_tr textarea veya Rich Text Editor */}
{/* ... */}
```

#### 4. Spin animasyonu (CSS):
Eğer projede yoksa, index.css veya inline style tag'e ekle:
```css
@keyframes spin { to { transform: rotate(360deg); } }
```

#### 5. Rich Text Editor ile entegrasyon:
Eğer description_tr için Tiptap Rich Text Editor kullanılıyorsa, `acceptAiDescription` fonksiyonunda editör içeriğini de güncelle:
```tsx
const acceptAiDescription = () => {
  if (aiPreview) {
    // Form state'i güncelle
    setItemForm(prev => ({ ...prev, description_tr: aiPreview }));
    
    // Rich text editor varsa, içeriğini de güncelle
    // editor referansı varsa:
    // editor?.commands.setContent(`<p>${aiPreview}</p>`);
    
    setAiPreview(null);
  }
};
```

#### 6. supabaseAnonKey import:
Edge Function çağrısında apikey header lazım. Mevcut supabase.ts'ten import et:
```tsx
// supabase.ts'ten key'i export et (eğer henüz export edilmiyorsa)
// Veya doğrudan kullan:
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIs...'; // mevcut key
```

---

## GÖREV 3: EDGE FUNCTION DEPLOY

Claude Code şu komutları sırayla çalıştırsın:

```bash
# 1. Dizin oluştur
mkdir -p supabase/functions/generate-description

# 2. index.ts dosyasını oluştur (Görev 1'deki kod)
# ... (cat veya python3 -c ile yaz)

# 3. Deploy et
supabase functions deploy generate-description --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
```

**NOT:** ANTHROPIC_API_KEY zaten Supabase secrets'ta ayarlandı, tekrar eklemeye gerek yok.

---

## ÖNEMLİ KURALLAR

1. **Sadece Türkçe** — AI sadece TR açıklama üretir. Diğer diller çeviri merkezinden
2. **Önizleme zorunlu** — AI ürettiği metni direkt form'a yazmasın, kullanıcı önce görsün
3. **Tone seçimi** — 3 ton: Detaylı (varsayılan), Şık (lüks restoranlar), Samimi (kafeler)
4. **Mevcut açıklama varsa** — AI onu iyileştirir (prompt'a dahil edilir)
5. **Ürün adı zorunlu** — Ad girilmeden AI butonu disabled
6. **Rate limiting yok** — şimdilik client-side UX ile sınırla (buton disable), server-side ileride
7. **Maliyet** — Haiku ~$0.25/1M token, bir açıklama ~150 token = ~$0.00004. 25.000 açıklama = ~$1
8. **İkon:** CiWand1 (sihirli değnek) — react-icons/ci'den

---

## KONTROL LİSTESİ

### Edge Function
- [ ] supabase/functions/generate-description/index.ts oluşturuldu
- [ ] CORS headers doğru
- [ ] Anthropic API çağrısı çalışıyor (claude-haiku-4-5-20251001)
- [ ] Hata durumunda anlamlı mesaj dönüyor
- [ ] Deploy edildi (--no-verify-jwt)

### Admin Panel
- [ ] "AI ile Yaz" butonu description_tr alanının üstünde
- [ ] Ton seçici (Detaylı/Şık/Samimi) dropdown
- [ ] Loading state (spinner + "Yazılıyor...")
- [ ] Ürün adı yoksa buton disabled
- [ ] AI önizleme kutusu (pembe border, Kullan/Tekrar Üret/İptal)
- [ ] "Kullan" → description_tr'ye yazar
- [ ] "Tekrar Üret" → yeni açıklama üretir
- [ ] "İptal" → önizlemeyi kapatır
- [ ] Rich Text Editor ile uyumlu (Tiptap varsa)

### Test Senaryoları
- [ ] "Mercimek Çorbası" → iştah açıcı TR açıklama üretir
- [ ] "Grilled Salmon" → yine Türkçe açıklama üretir (sadece TR)
- [ ] Mevcut açıklama varken → iyileştirilmiş versiyon üretir
- [ ] 3 ton farkını test et
- [ ] Allerjen bilgisi prompt'a dahil ama açıklamada yazılmıyor

### Final
- [ ] npm run build başarılı
- [ ] git push origin main
