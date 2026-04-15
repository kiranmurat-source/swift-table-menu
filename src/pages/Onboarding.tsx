import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';
import TabbledLogo from '@/components/TabbledLogo';

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [form, setForm] = useState({
    restaurant_name: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, role')
        .eq('id', user.id)
        .single();

      if (profile?.restaurant_id) {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (profile?.role === 'super_admin') {
        navigate('/dashboard', { replace: true });
        return;
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.restaurant_name.trim()) {
      newErrors.restaurant_name = 'İşletme adı zorunludur';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      // Slug oluştur (Türkçe karakter desteği)
      const slug = form.restaurant_name.trim()
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substring(2, 6);

      // Restoran oluştur
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: form.restaurant_name.trim(),
          slug: slug,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          is_active: true,
          subscription_status: 'trial',
          current_plan: 'basic',
          ai_credits_total: 60,
          ai_credits_used: 0,
          theme_color: 'white',
        })
        .select()
        .single();

      if (restError) throw restError;

      // Profile'a restaurant_id bağla + isim güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          restaurant_id: restaurant.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Trial subscription oluştur (14 gün Basic)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .order('sort_order', { ascending: true });

      const basicPlan = plans?.find(p =>
        p.name.toLowerCase().includes('basic') || p.name.toLowerCase().includes('başlangıç')
      );

      if (basicPlan) {
        await supabase
          .from('subscriptions')
          .insert({
            restaurant_id: restaurant.id,
            plan_id: basicPlan.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            payment_method: 'trial',
            notes: '14 gün ücretsiz deneme — Google ile kayıt',
          });
      }

      navigate('/dashboard', { replace: true });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyin.';
      console.error('Onboarding error:', err);
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #E5E5E3', borderTopColor: '#FF4F7A', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    border: '1px solid #E5E5E3', borderRadius: 8, outline: 'none',
    background: '#FFFFFF', color: '#1C1C1E', boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <>
      <Helmet>
        <title>İşletme Bilgileri | Tabbled</title>
      </Helmet>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5', fontFamily: "'Roboto', -apple-system, sans-serif", padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <TabbledLogo logoType="vertical" sizeClass="h-20" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', marginTop: 16 }}>Hoş Geldiniz!</h1>
            <p style={{ color: '#6B6B6F', fontSize: 14, marginTop: 8 }}>
              İşletme bilgilerinizi girin, 14 günlük ücretsiz denemeniz hemen başlasın.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* İşletme Adı (zorunlu) */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#2D2D2F', marginBottom: 6 }}>
                İşletme Adı <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={form.restaurant_name}
                onChange={(e) => setForm(prev => ({ ...prev, restaurant_name: e.target.value }))}
                placeholder="Örn: Café Istanbul"
                style={{ ...inputBase, borderColor: errors.restaurant_name ? '#F87171' : '#E5E5E3' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF4F7A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,79,122,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.restaurant_name ? '#F87171' : '#E5E5E3'; e.currentTarget.style.boxShadow = 'none'; }}
                autoFocus
              />
              {errors.restaurant_name && (
                <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.restaurant_name}</p>
              )}
            </div>

            {/* Telefon (opsiyonel) */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#2D2D2F', marginBottom: 6 }}>
                Telefon
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Örn: 0212 555 1234"
                style={inputBase}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF4F7A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,79,122,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E5E3'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Adres (opsiyonel) */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#2D2D2F', marginBottom: 6 }}>
                Adres
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Örn: Beyoğlu, İstanbul"
                rows={2}
                style={{ ...inputBase, resize: 'none' as const }}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF4F7A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,79,122,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E5E3'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Hata mesajı */}
            {errors.submit && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: 13 }}>
                {errors.submit}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px 20px', fontSize: 14, fontWeight: 600, color: '#FFFFFF',
                background: '#FF4F7A', border: 'none', borderRadius: 8,
                cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1,
                transition: 'background 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E8456E'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#FF4F7A'; }}
            >
              {loading && (
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              )}
              {loading ? 'Oluşturuluyor...' : 'Denemeyi Başlat'}
            </button>

            {/* Bilgi notu */}
            <p style={{ fontSize: 12, color: '#A0A0A0', textAlign: 'center', margin: 0 }}>
              Kredi kartı gerekmez · 14 gün ücretsiz · İstediğiniz zaman iptal
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
