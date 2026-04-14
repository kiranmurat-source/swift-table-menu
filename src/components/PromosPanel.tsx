import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Trash, Info, Image } from "@phosphor-icons/react";
import type { AdminTheme } from '../lib/adminTheme';
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import type { Promo } from './PromoPopup';
import { Restaurant, makeStyles } from './admin/dashboardShared';

type PromoCategory = { id: string; name_tr: string };

const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

type PromoFormState = {
  id: string | null;
  title_tr: string;
  title_en: string;
  description_tr: string;
  description_en: string;
  image_url: string;
  cta_text_tr: string;
  cta_text_en: string;
  cta_url: string;
  is_active: boolean;
  schedule_enabled: boolean;
  schedule_start_time: string;
  schedule_end_time: string;
  schedule_days: number[];
  show_once_per_session: boolean;
};

const emptyPromoForm: PromoFormState = {
  id: null,
  title_tr: '',
  title_en: '',
  description_tr: '',
  description_en: '',
  image_url: '',
  cta_text_tr: 'Detaylar',
  cta_text_en: 'Details',
  cta_url: '',
  is_active: true,
  schedule_enabled: false,
  schedule_start_time: '00:00',
  schedule_end_time: '23:59',
  schedule_days: [0, 1, 2, 3, 4, 5, 6],
  show_once_per_session: true,
};

function PromosTab({ restaurant, theme }: { restaurant: Restaurant; theme: AdminTheme }) {
  const S = useMemo(() => makeStyles(theme), [theme]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [promoCategories, setPromoCategories] = useState<PromoCategory[]>([]);
  const [form, setForm] = useState<PromoFormState>(emptyPromoForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const promoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id]);

  async function load() {
    const [{ data: promoData }, { data: catData }] = await Promise.all([
      supabase.from('restaurant_promos').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
      supabase.from('menu_categories').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
    ]);
    setPromos((promoData || []) as Promo[]);
    setPromoCategories((catData || []) as PromoCategory[]);
  }

  function normalizeTime(t: string): string {
    // DB may return 'HH:MM:SS'; form expects 'HH:MM'
    return (t || '').split(':').slice(0, 2).join(':').padStart(5, '0');
  }

  function startEdit(p: Promo) {
    setForm({
      id: p.id,
      title_tr: p.title_tr || '',
      title_en: p.title_en || '',
      description_tr: p.description_tr || '',
      description_en: p.description_en || '',
      image_url: p.image_url || '',
      cta_text_tr: p.cta_text_tr || 'Detaylar',
      cta_text_en: p.cta_text_en || 'Details',
      cta_url: p.cta_url || '',
      is_active: p.is_active,
      schedule_enabled: p.schedule_enabled,
      schedule_start_time: normalizeTime(p.schedule_start_time),
      schedule_end_time: normalizeTime(p.schedule_end_time),
      schedule_days: p.schedule_days || [0, 1, 2, 3, 4, 5, 6],
      show_once_per_session: p.show_once_per_session,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(emptyPromoForm);
    setShowForm(false);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${restaurant.slug}/promos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true });
    if (error) { setMsg('Görsel yükleme hatası: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      restaurant_id: restaurant.id,
      title_tr: form.title_tr,
      title_en: form.title_en || null,
      description_tr: form.description_tr || null,
      description_en: form.description_en || null,
      image_url: form.image_url || null,
      cta_text_tr: form.cta_text_tr || null,
      cta_text_en: form.cta_text_en || null,
      cta_url: form.cta_url || null,
      is_active: form.is_active,
      schedule_enabled: form.schedule_enabled,
      schedule_start_time: form.schedule_start_time,
      schedule_end_time: form.schedule_end_time,
      schedule_days: form.schedule_days,
      show_once_per_session: form.show_once_per_session,
    };
    if (form.id) {
      const { error } = await supabase.from('restaurant_promos').update(payload).eq('id', form.id);
      if (error) setMsg('Hata: ' + error.message);
      else setMsg('Promo güncellendi');
    } else {
      const { error } = await supabase.from('restaurant_promos').insert({ ...payload, sort_order: promos.length });
      if (error) setMsg('Hata: ' + error.message);
      else setMsg('Promo eklendi');
    }
    setSaving(false);
    resetForm();
    load();
    setTimeout(() => setMsg(''), 3000);
  }

  async function toggleActive(p: Promo) {
    await supabase.from('restaurant_promos').update({ is_active: !p.is_active }).eq('id', p.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Bu promo silinecek. Emin misiniz?')) return;
    await supabase.from('restaurant_promos').delete().eq('id', id);
    load();
  }

  function toggleDay(day: number) {
    setForm(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...prev.schedule_days, day].sort(),
    }));
  }

  return (
    <div>
      {msg && (
        <div style={{ padding: '10px 14px', background: msg.includes('Hata') ? '#FEE2E2' : '#DCFCE7', border: `1px solid ${msg.includes('Hata') ? '#FECACA' : '#DCFCE7'}`, borderRadius: 8, color: msg.includes('Hata') ? '#EF4444' : '#22C55E', fontSize: 13, marginBottom: 16, cursor: 'pointer' }} onClick={() => setMsg('')}>
          {msg} <span style={{ float: 'right' }}>✕</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1C1C1E' }}>Promosyonlar</h3>
        <button onClick={() => { if (showForm) resetForm(); else { setForm(emptyPromoForm); setShowForm(true); } }} style={S.btnSm}>
          {showForm ? 'İptal' : '+ Yeni Promo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Image */}
          <div>
            <label style={S.label}>Promo Görseli</label>
            <input ref={promoFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
            {form.image_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img onError={handleImageError} src={getOptimizedImageUrl(form.image_url, 'card')} alt="" style={{ width: 120, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E5E3' }} />
                <button type="button" onClick={() => promoFileRef.current?.click()} disabled={uploading} style={S.btnSm}>{uploading ? '...' : 'Değiştir'}</button>
                <button type="button" onClick={() => setForm({ ...form, image_url: '' })} style={S.btnDanger}><Trash size={12} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => promoFileRef.current?.click()} disabled={uploading} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Camera size={14} /> {uploading ? 'Yükleniyor...' : 'Görsel Yükle'}
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>1080×1080px, kare, max 5MB</span></div>
          </div>

          <div style={S.grid2}>
            <div>
              <label style={S.label}>Başlık (TR) *</label>
              <input style={S.input} value={form.title_tr} onChange={e => setForm({ ...form, title_tr: e.target.value })} required placeholder="Happy Hour!" />
            </div>
            <div>
              <label style={S.label}>Başlık (EN)</label>
              <input style={S.input} value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} placeholder="Happy Hour!" />
            </div>
          </div>

          <div style={S.grid2}>
            <div>
              <label style={S.label}>Açıklama (TR)</label>
              <input style={S.input} value={form.description_tr} onChange={e => setForm({ ...form, description_tr: e.target.value })} placeholder="Tüm içeceklerde %30 indirim" />
            </div>
            <div>
              <label style={S.label}>Açıklama (EN)</label>
              <input style={S.input} value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="30% off all drinks" />
            </div>
          </div>

          <div style={S.grid3}>
            <div>
              <label style={S.label}>CTA Metin (TR)</label>
              <input style={S.input} value={form.cta_text_tr} onChange={e => setForm({ ...form, cta_text_tr: e.target.value })} placeholder="Detaylar" />
            </div>
            <div>
              <label style={S.label}>CTA Metin (EN)</label>
              <input style={S.input} value={form.cta_text_en} onChange={e => setForm({ ...form, cta_text_en: e.target.value })} placeholder="Details" />
            </div>
            <div>
              <label style={S.label}>CTA Yönlendirme</label>
              <select
                style={S.input}
                value={form.cta_url}
                onChange={e => setForm({ ...form, cta_url: e.target.value })}
              >
                <option value="">Popup'ı kapat (yönlendirme yok)</option>
                {promoCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name_tr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div style={{ borderTop: '1px solid #F7F7F5', paddingTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#2D2D2F', fontWeight: 600 }}>
              <input type="checkbox" checked={form.schedule_enabled} onChange={e => setForm({ ...form, schedule_enabled: e.target.checked })} />
              Saat Planlaması
            </label>
            {form.schedule_enabled && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Başlangıç</label>
                    <input type="time" style={S.input} value={form.schedule_start_time} onChange={e => setForm({ ...form, schedule_start_time: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Bitiş</label>
                    <input type="time" style={S.input} value={form.schedule_end_time} onChange={e => setForm({ ...form, schedule_end_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={S.label}>Günler</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {DAYS_TR.map((label, idx) => {
                      const selected = form.schedule_days.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleDay(idx)}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            borderRadius: 20,
                            cursor: 'pointer',
                            border: selected ? '2px solid #22C55E' : '1px solid #E5E5E3',
                            background: selected ? '#DCFCE7' : '#fff',
                            color: selected ? '#22C55E' : '#2D2D2F',
                            fontWeight: selected ? 700 : 400,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              Aktif
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
              <input type="checkbox" checked={form.show_once_per_session} onChange={e => setForm({ ...form, show_once_per_session: e.target.checked })} />
              Session başına bir kez göster
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={S.btn}>{saving ? '...' : form.id ? 'Güncelle' : 'Kaydet'}</button>
            <button type="button" onClick={resetForm} style={S.btnSm}>İptal</button>
          </div>
        </form>
      )}

      {promos.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: '#A0A0A0', padding: 40, fontSize: 14 }}>
          Henüz promo eklenmedi.
        </div>
      )}

      {promos.map(p => (
        <div key={p.id} style={{ ...S.card, opacity: p.is_active ? 1 : 0.55 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {p.image_url ? (
              <img onError={handleImageError} src={getOptimizedImageUrl(p.image_url, 'card')} alt="" style={{ width: 84, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 84, height: 56, borderRadius: 8, background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Image size={24} style={{ color: '#A0A0A0' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>{p.title_tr}</div>
              {p.description_tr && <div style={{ fontSize: 13, color: '#6B6B6F', marginTop: 2 }}>{p.description_tr}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...S.badge, background: p.is_active ? '#DCFCE7' : '#FEE2E2', color: p.is_active ? '#22C55E' : '#EF4444' }}>
                  {p.is_active ? 'Aktif' : 'Pasif'}
                </span>
                {p.schedule_enabled && (
                  <span style={{ fontSize: 11, color: '#6B6B6F' }}>
                    {normalizeTime(p.schedule_start_time)} - {normalizeTime(p.schedule_end_time)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid #F7F7F5', paddingTop: 10 }}>
            <button onClick={() => toggleActive(p)} style={{ ...S.btnSm, color: p.is_active ? '#22C55E' : '#EF4444' }}>
              {p.is_active ? 'Aktif' : 'Pasif'}
            </button>
            <button onClick={() => startEdit(p)} style={S.btnSm}>Düzenle</button>
            <button onClick={() => remove(p.id)} style={S.btnDanger}>Sil</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export { PromosTab };
