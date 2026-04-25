// TODO: This file is 3000+ lines. Next sprint, split each tab into a lazy-loaded
// child component to improve maintainability and reduce the Dashboard bundle:
//   - Menü      → components/menu/MenuManager.tsx
//   - Çeviri    → components/translation/TranslationCenter.tsx (already a component, inline this)
//   - QR        → components/qr/QRCodesPanel.tsx (already exists as QRManager)
//   - Profil    → components/profile/ProfileTab.tsx (currently inline)
//   - Promosyon → components/promos/PromosTab.tsx (currently inline)
// Dashboard/Analytics already lives in components/dashboard/RestaurantAnalytics.tsx.
import { useEffect, useMemo, useState, useRef, Fragment, lazy, Suspense, ReactNode, CSSProperties } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { Camera, PencilSimple, CheckCircle, XCircle, AppleLogo, Star, Globe, Pen, Rows, User, Image, Trash, Link, Package, CaretCircleDown, CaretCircleUp, PlusCircle, Clock, Grains, Timer, Info, Bell, List, SquaresFour, Tag, Palette, ChatCircle, Percent, Heart, ChartBar, ArrowsClockwise, X, VideoCamera, Users, Gauge, Images, FileArrowUp, Sparkle } from "@phosphor-icons/react";
import MediaLibrary from '../components/admin/MediaLibrary';
import MediaPickerModal, { type MediaAccept, attachMediaUsage, detachMediaUsage } from '../components/admin/MediaPickerModal';
import MenuImport from '../components/admin/MenuImport';
import { useAICredits } from '../hooks/useAICredits';
import { AI_CREDIT_COSTS } from '../lib/aiCredits';
import { NUTRI_SCORE_COLORS, NUTRI_SCORE_VALUES } from "@/lib/nutritionEU";
import RestaurantAnalytics from "@/components/dashboard/RestaurantAnalytics";
import TabbledLogo from '@/components/TabbledLogo';
import FeedbackPanel from '../components/FeedbackPanel';
import DiscountCodesPanel from '../components/DiscountCodesPanel';
import LikesPanel from '../components/LikesPanel';
import CustomersPanel from '../components/CustomersPanel';
import NotificationsPanel from '../components/NotificationsPanel';
import { hasFeature } from '../lib/planFeatures';
import { getAdminTheme, type AdminTheme } from '../lib/adminTheme';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortableRenderProps = {
  setNodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
  isDragging: boolean;
};

function Sortable({ id, children }: { id: string; children: (p: SortableRenderProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };
  return <>{children({ setNodeRef, style, attributes: attributes as Record<string, unknown>, listeners, isDragging })}</>;
}
import QRManager from '../components/QRManager';
import TranslationCenter from '../components/TranslationCenter';
import WaiterCallsPanel from '../components/WaiterCallsPanel';
const RichTextEditor = lazy(() => import('../components/RichTextEditor'));
import { CategoryTabSkeleton, ListSkeleton } from '../components/Skeleton';
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import { ALLERGEN_LIST, DIET_LIST, getAllergenInfo } from '../lib/allergens';
import { AllergenIcon } from '../components/AllergenIcon';
import { THEMES } from '../lib/themes';
import type { Promo } from '../components/PromoPopup';
import { useBaseCurrencySymbol } from '../lib/currencySymbols';
import { ProfileTab } from '../components/ProfilePanel';
import { LegalSettings } from '../components/admin/LegalSettings';
import { PDFDownloadButton } from '../components/admin/pdf/PDFDownloadButton';
import { PromosTab } from '../components/PromosPanel';
import { Restaurant, makeStyles, toggleSwitchStyle, toggleKnobStyle } from '../components/admin/dashboardShared';

type Translations = {
  [lang: string]: {
    name?: string;
    description?: string;
  };
};

type Category = { id: string; name_tr: string; name_en: string | null; sort_order: number; is_active: boolean; translations: Translations; image_url: string | null; video_url: string | null; parent_id: string | null; };

type PeriodicDay = { enabled: boolean; start: string; end: string; all_day?: boolean };
type PeriodicSchedule = Partial<Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', PeriodicDay>>;

type PriceVariant = {
  name_tr: string;
  name_en: string;
  price: number;
  calories: number | null;
};

type Nutrition = {
  serving_size?: string;
  calories?: number;
  calories_from_fat?: number;
  total_fat?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  total_carb?: number;
  dietary_fiber?: number;
  sugars?: number;
  protein?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
  show_on_menu?: boolean;
};

type MenuItem = {
  id: string; category_id: string; name_tr: string; name_en: string | null;
  description_tr: string | null; description_en: string | null; price: number;
  image_url: string | null; video_url: string | null; is_available: boolean; is_popular: boolean; sort_order: number;
  calories: number | null; allergens: string[] | null; is_vegetarian: boolean; is_new: boolean;
  is_featured: boolean;
  is_sold_out: boolean;
  schedule_type: 'always' | 'date_range' | 'periodic';
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_periodic: PeriodicSchedule;
  price_variants: PriceVariant[];
  nutrition: Nutrition | null;
  nutri_score: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  prep_time: number | null;
  translations: Translations;
};


const ALLERGEN_OPTIONS = ALLERGEN_LIST.map(a => ({ value: a.key, label: a.name_tr }));
const DIET_OPTIONS = DIET_LIST.map(a => ({ value: a.key, label: a.name_tr }));

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';



const PERIODIC_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type PeriodicDayKey = typeof PERIODIC_DAYS[number];
const PERIODIC_DAY_LABELS: Record<PeriodicDayKey, string> = {
  monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba', thursday: 'Perşembe',
  friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
};
const defaultPeriodicSchedule = (): Record<PeriodicDayKey, { enabled: boolean; start: string; end: string; all_day: boolean }> => ({
  monday:    { enabled: false, start: '09:00', end: '17:00', all_day: false },
  tuesday:   { enabled: false, start: '09:00', end: '17:00', all_day: false },
  wednesday: { enabled: false, start: '09:00', end: '17:00', all_day: false },
  thursday:  { enabled: false, start: '09:00', end: '17:00', all_day: false },
  friday:    { enabled: false, start: '09:00', end: '17:00', all_day: false },
  saturday:  { enabled: false, start: '09:00', end: '17:00', all_day: false },
  sunday:    { enabled: false, start: '09:00', end: '17:00', all_day: false },
});

function InlinePrice({ value, isSoldOut, onSave, symbol = '₺' }: { value: number; isSoldOut: boolean; onSave: (n: number) => Promise<void>; symbol?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!editing) setDraft(value.toString()); }, [value, editing]);
  const commit = async () => {
    const n = parseFloat(draft);
    if (!Number.isFinite(n) || n < 0) { setDraft(value.toString()); setEditing(false); return; }
    if (n === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(n);
    setSaving(false);
    setEditing(false);
  };
  if (editing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number"
          step="0.01"
          min="0"
          autoFocus
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { setDraft(value.toString()); setEditing(false); }
          }}
          style={{ width: 80, padding: '4px 8px', fontSize: 14, fontWeight: 700, border: '1px solid #1C1C1E', borderRadius: 6, outline: 'none' }}
        />
        <span style={{ fontSize: 14, color: '#1C1C1E', fontWeight: 700 }}>{symbol}</span>
        {saving && <span style={{ fontSize: 10, color: '#6B6B6F' }}>...</span>}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: '#1C1C1E',
        background: 'none',
        border: '1px dashed transparent',
        borderRadius: 4,
        padding: '2px 6px',
        cursor: 'pointer',
        textDecoration: isSoldOut ? 'line-through' : 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E5E5E3')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
      title="Düzenlemek için tıkla"
    >
      {Number(value).toFixed(2)} {symbol}
    </button>
  );
}

type VariantDraft = { name_tr: string; name_en: string; price: string; calories: string };

type NutritionDraft = {
  show_on_menu: boolean;
  serving_size: string;
  calories: string;
  calories_from_fat: string;
  total_fat: string;
  saturated_fat: string;
  trans_fat: string;
  cholesterol: string;
  sodium: string;
  total_carb: string;
  dietary_fiber: string;
  sugars: string;
  protein: string;
  vitamin_a: string;
  vitamin_c: string;
  calcium: string;
  iron: string;
};

const emptyNutritionDraft = (): NutritionDraft => ({
  show_on_menu: true,
  serving_size: '',
  calories: '',
  calories_from_fat: '',
  total_fat: '',
  saturated_fat: '',
  trans_fat: '',
  cholesterol: '',
  sodium: '',
  total_carb: '',
  dietary_fiber: '',
  sugars: '',
  protein: '',
  vitamin_a: '',
  vitamin_c: '',
  calcium: '',
  iron: '',
});

// Numeric field keys on the nutrition draft (everything except show_on_menu and serving_size)
const NUTRITION_NUMERIC_KEYS: Array<keyof NutritionDraft> = [
  'calories', 'calories_from_fat', 'total_fat', 'saturated_fat', 'trans_fat',
  'cholesterol', 'sodium', 'total_carb', 'dietary_fiber', 'sugars', 'protein',
  'vitamin_a', 'vitamin_c', 'calcium', 'iron',
];

const emptyItemForm = {
  name_tr: '', description_tr: '', price: '', image_url: '', video_url: '',
  recommended_ids: [] as string[],
  recommendation_reasons: {} as Record<string, { tr: string; en: string }>,
  allergens: [] as string[], is_vegetarian: false, is_new: false, is_featured: false,
  is_sold_out: false,
  schedule_type: 'always' as 'always' | 'date_range' | 'periodic',
  schedule_start: '',
  schedule_end: '',
  schedule_periodic: defaultPeriodicSchedule(),
  category_id: '' as string,
  variants: [] as VariantDraft[],
  nutrition: emptyNutritionDraft(),
  nutritionOpen: false,
  nutri_score: '' as '' | 'A' | 'B' | 'C' | 'D' | 'E',
  prep_time: '',
  happy_hour_active: false,
  happy_hour_price: '' as string | number,
  happy_hour_label: '',
  happy_hour_days: null as string[] | null,
  happy_hour_start_time: '',
  happy_hour_end_time: '',
  happyHourOpen: false,
};

async function triggerTranslation(table: string, recordId: string, languages: string[]) {
  if (languages.length === 0) return;
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/translate-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, record_id: recordId, languages }),
    });
  } catch (err) {
    console.error('Translation error:', err);
  }
}


/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function RestaurantDashboard() {
  const { user, signOut } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const baseSymbol = useBaseCurrencySymbol(restaurant?.base_currency);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [catForm, setCatForm] = useState<{ name_tr: string; image_url: string; video_url: string; parent_id: string | null }>({ name_tr: '', image_url: '', video_url: '', parent_id: null });
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiTone, setAiTone] = useState<'elegant' | 'casual' | 'descriptive'>('descriptive');
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatForm, setEditCatForm] = useState({ name_tr: '' });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'import' | 'translations' | 'qr' | 'media' | 'profile' | 'promos' | 'calls' | 'feedback' | 'discounts' | 'likes' | 'customers' | 'bildirimler'>('dashboard');
  const [pendingCallCount, setPendingCallCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const openSidebar = () => setSidebarOpen(true);
    window.addEventListener('tabbled:open-sidebar', openSidebar);
    return () => window.removeEventListener('tabbled:open-sidebar', openSidebar);
  }, []);

  useEffect(() => {
    const setTabFromEvent = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (typeof key === 'string') setActiveTab(key as typeof activeTab);
    };
    window.addEventListener('tabbled:set-tab', setTabFromEvent as EventListener);
    return () => window.removeEventListener('tabbled:set-tab', setTabFromEvent as EventListener);
  }, []);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarHoverTimerRef = useRef<number | null>(null);
  const handleSidebarEnter = () => {
    if (!isDesktop) return;
    if (sidebarHoverTimerRef.current != null) {
      window.clearTimeout(sidebarHoverTimerRef.current);
      sidebarHoverTimerRef.current = null;
    }
    setSidebarHovered(true);
  };
  const handleSidebarLeave = () => {
    if (!isDesktop) return;
    if (sidebarHoverTimerRef.current != null) {
      window.clearTimeout(sidebarHoverTimerRef.current);
    }
    sidebarHoverTimerRef.current = window.setTimeout(() => {
      setSidebarHovered(false);
      sidebarHoverTimerRef.current = null;
    }, 80);
  };
  const [loadingData, setLoadingData] = useState(true);
  const initialFormJsonRef = useRef<string>('');
  const [picker, setPicker] = useState<{
    accept: MediaAccept;
    onPick: (url: string) => void;
  } | null>(null);
  const openPicker = (accept: MediaAccept, onPick: (url: string) => void) =>
    setPicker({ accept, onPick });
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  const adminTheme = useMemo(() => getAdminTheme(restaurant?.admin_theme), [restaurant?.admin_theme]);
  const S = useMemo(() => makeStyles(adminTheme), [adminTheme]);

  const enabledLangs = (restaurant?.enabled_languages ?? []).filter(l => l !== 'tr');
  const plan = (restaurant?.current_plan || '').toLowerCase();
  const hasAI = plan === 'pro' || plan === 'premium' || plan === 'basic' || plan === 'enterprise';
  const aiCredits = useAICredits(restaurant?.id);

  // Smooth-scroll the inline item form into view when it opens.
  useEffect(() => {
    if (showItemForm && formContainerRef.current) {
      formContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showItemForm, editingItem]);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.restaurant_id) {
            supabase.from('restaurants').select('*').eq('id', data.restaurant_id).single()
              .then(({ data: r }) => {
                if (r) {
                  setRestaurant(r);
                  Promise.all([loadCategories(r.id), loadItems(r.id)]).finally(() => setLoadingData(false));
                } else {
                  setLoadingData(false);
                }
              });
          } else {
            setLoadingData(false);
          }
        });
    }
  }, [user]);

  // Waiter calls: pending count + realtime
  useEffect(() => {
    if (!restaurant) return;
    const rid = restaurant.id;

    // Initial count
    supabase
      .from('waiter_calls')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', rid)
      .in('status', ['pending', 'acknowledged'])
      .then(({ count }) => { if (count != null) setPendingCallCount(count); });

    // Realtime
    const channel = supabase
      .channel('waiter-calls-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls', filter: `restaurant_id=eq.${rid}` }, () => {
        // Re-fetch count on any change
        supabase
          .from('waiter_calls')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', rid)
          .in('status', ['pending', 'acknowledged'])
          .then(({ count }) => { if (count != null) setPendingCallCount(count); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id]);

  // Trial subscription check
  useEffect(() => {
    if (!restaurant?.id) return;

    const checkSubscription = async () => {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('end_date', { ascending: false })
        .limit(1);

      const activeSub = subs?.[0];

      if (!activeSub) {
        setTrialExpired(true);
        return;
      }

      const endDate = new Date(activeSub.end_date);
      const now = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        setTrialExpired(true);
        if (activeSub.status !== 'expired') {
          await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', activeSub.id);
        }
      } else {
        setTrialDaysLeft(daysLeft);
      }
    };

    checkSubscription();
  }, [restaurant?.id]);

  // Responsive: drawer below 1024, hover-expand rail at/above 1024
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(false);
      else setSidebarHovered(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => () => {
    if (sidebarHoverTimerRef.current != null) window.clearTimeout(sidebarHoverTimerRef.current);
  }, []);

  async function loadCategories(rid: string) {
    const { data } = await supabase.from('menu_categories').select('*').eq('restaurant_id', rid).order('sort_order');
    setCategories(data || []);
  }
  async function loadItems(rid: string) {
    const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', rid).order('sort_order');
    setItems(data || []);
  }

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function persistCategoryOrder(ordered: Category[]) {
    await Promise.all(
      ordered.map((c, i) => supabase.from('menu_categories').update({ sort_order: i }).eq('id', c.id))
    );
  }

  async function persistItemOrder(ordered: MenuItem[]) {
    await Promise.all(
      ordered.map((it, i) => supabase.from('menu_items').update({ sort_order: i }).eq('id', it.id))
    );
  }

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategories((prev) => {
      const activeCat = prev.find((c) => c.id === active.id);
      const overCat = prev.find((c) => c.id === over.id);
      if (!activeCat || !overCat) return prev;
      // Only reorder within the same parent scope
      if ((activeCat.parent_id ?? null) !== (overCat.parent_id ?? null)) return prev;
      const scope = prev.filter((c) => (c.parent_id ?? null) === (activeCat.parent_id ?? null));
      const others = prev.filter((c) => (c.parent_id ?? null) !== (activeCat.parent_id ?? null));
      const oldIndex = scope.findIndex((c) => c.id === active.id);
      const newIndex = scope.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const reordered = arrayMove(scope, oldIndex, newIndex);
      persistCategoryOrder(reordered);
      return [...others, ...reordered];
    });
  }

  function handleChildCategoryDragEnd(parentId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategories((prev) => {
      const scope = prev.filter((c) => c.parent_id === parentId);
      const others = prev.filter((c) => c.parent_id !== parentId);
      const oldIndex = scope.findIndex((c) => c.id === active.id);
      const newIndex = scope.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const reordered = arrayMove(scope, oldIndex, newIndex);
      persistCategoryOrder(reordered);
      return [...others, ...reordered];
    });
  }

  function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedCat) return;
    setItems((prev) => {
      const inCat = prev.filter((i) => i.category_id === selectedCat);
      const others = prev.filter((i) => i.category_id !== selectedCat);
      const oldIndex = inCat.findIndex((i) => i.id === active.id);
      const newIndex = inCat.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const reordered = arrayMove(inCat, oldIndex, newIndex);
      persistItemOrder(reordered);
      return [...others, ...reordered];
    });
  }

  async function generateAIDescription() {
    if (!restaurant || !itemForm.name_tr) return;
    setGeneratingAI(true);
    setAiPreview(null);
    try {
      const catNameVal = selectedCat ? categories.find(c => c.id === selectedCat)?.name_tr || '' : '';
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          item_id: editingItem || 'new',
          name_tr: itemForm.name_tr,
          category_name: catNameVal,
          price: itemForm.price,
          allergens: itemForm.allergens,
          is_vegetarian: itemForm.allergens.includes('vegetarian'),
          calories: itemForm.nutrition.calories ? parseInt(itemForm.nutrition.calories) : null,
          tone: aiTone,
          currentDesc: itemForm.description_tr || '',
        }),
      });
      const data = await res.json();
      if (data.success && data.description) {
        setAiPreview(data.description);
        aiCredits.refresh();
        if (data.usage && data.limit) {
          setMsg(`AI açıklama oluşturuldu (${data.usage}/${data.limit} kredi kullanıldı)`);
          setTimeout(() => setMsg(''), 4000);
        }
      } else {
        setMsg(data.error || 'AI açıklama oluşturulamadı');
      }
    } catch (err) {
      setMsg('AI servisi bağlantı hatası');
    }
    setGeneratingAI(false);
  }

  function acceptAiDescription() {
    if (aiPreview) {
      setItemForm(prev => ({ ...prev, description_tr: aiPreview }));
      setAiPreview(null);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant) return;
    setSaving(true);
    const { data: newCat, error } = await supabase.from('menu_categories').insert({
      restaurant_id: restaurant.id,
      name_tr: catForm.name_tr,
      image_url: catForm.image_url || null,
      video_url: catForm.video_url || null,
      parent_id: catForm.parent_id,
      sort_order: categories.filter(c => (c.parent_id ?? null) === (catForm.parent_id ?? null)).length,
      translations: {},
    }).select().single();
    if (error) { setMsg(error.message); }
    else {
      if (newCat) {
        if (catForm.image_url) await attachMediaUsage(catForm.image_url, { type: 'menu_category', id: newCat.id, field: 'image_url', label: catForm.name_tr });
        if (catForm.video_url && catForm.video_url.includes('/menu-images/')) await attachMediaUsage(catForm.video_url, { type: 'menu_category', id: newCat.id, field: 'video_url', label: catForm.name_tr });
      }
      setCatForm({ name_tr: '', image_url: '', video_url: '', parent_id: null }); setShowCatForm(false);
      loadCategories(restaurant.id);
      if (newCat && enabledLangs.length > 0) {
        setTranslating(newCat.id);
        await triggerTranslation('menu_categories', newCat.id, enabledLangs);
        setTranslating(null);
        loadCategories(restaurant.id);
      }
    }
    setSaving(false);
  }

  async function setCategoryImageFromPicker(target: 'new' | string, url: string) {
    if (!restaurant) return;
    if (target === 'new') {
      setCatForm(prev => ({ ...prev, image_url: url }));
    } else {
      const cat = categories.find(c => c.id === target);
      if (cat?.image_url) await detachMediaUsage(cat.image_url, { type: 'menu_category', id: target, field: 'image_url' });
      await supabase.from('menu_categories').update({ image_url: url }).eq('id', target);
      await attachMediaUsage(url, { type: 'menu_category', id: target, field: 'image_url', label: cat?.name_tr });
      loadCategories(restaurant.id);
    }
  }

  async function removeCategoryImage(id: string) {
    if (!restaurant) return;
    const cat = categories.find(c => c.id === id);
    if (cat?.image_url) await detachMediaUsage(cat.image_url, { type: 'menu_category', id, field: 'image_url' });
    await supabase.from('menu_categories').update({ image_url: null }).eq('id', id);
    loadCategories(restaurant.id);
  }

  async function setCategoryVideoFromPicker(id: string, url: string) {
    if (!restaurant) return;
    const cat = categories.find(c => c.id === id);
    if (cat?.video_url && cat.video_url.includes('/menu-images/')) {
      await detachMediaUsage(cat.video_url, { type: 'menu_category', id, field: 'video_url' });
    }
    await supabase.from('menu_categories').update({ video_url: url }).eq('id', id);
    if (url.includes('/menu-images/')) {
      await attachMediaUsage(url, { type: 'menu_category', id, field: 'video_url', label: cat?.name_tr });
    }
    loadCategories(restaurant.id);
  }

  async function removeCategoryVideo(id: string) {
    if (!restaurant) return;
    const cat = categories.find(c => c.id === id);
    if (cat?.video_url && cat.video_url.includes('/menu-images/')) {
      await detachMediaUsage(cat.video_url, { type: 'menu_category', id, field: 'video_url' });
    }
    await supabase.from('menu_categories').update({ video_url: null }).eq('id', id);
    loadCategories(restaurant.id);
  }
  async function updateCategory(id: string) {
    if (!restaurant) return;
    await supabase.from('menu_categories').update({ name_tr: editCatForm.name_tr }).eq('id', id);
    setEditingCat(null);
    loadCategories(restaurant.id);
    if (enabledLangs.length > 0) {
      setTranslating(id);
      await triggerTranslation('menu_categories', id, enabledLangs);
      setTranslating(null);
      loadCategories(restaurant.id);
    }
  }
  async function deleteCategory(id: string) {
    if (!restaurant || !confirm('Bu kategori ve tüm ürünleri silinecek. Emin misiniz?')) return;
    await supabase.from('menu_categories').delete().eq('id', id);
    loadCategories(restaurant.id); loadItems(restaurant.id);
    if (selectedCat === id) setSelectedCat(null);
  }


  async function addOrUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant || !selectedCat) return;

    // Resolve target category: form dropdown overrides the currently-open list
    const targetCategoryId = itemForm.category_id || selectedCat;

    // Validate + normalise variants
    let priceForDb = parseFloat(itemForm.price);
    let priceVariants: PriceVariant[] = [];
    if (itemForm.variants.length > 0) {
      if (itemForm.variants.length < 2) {
        setMsg('Çoklu fiyat modu için en az 2 varyant gerekir. Tek fiyata dönmek için "Tek fiyata dön" linkini kullanın.');
        return;
      }
      const parsed: PriceVariant[] = [];
      for (const v of itemForm.variants) {
        const price = parseFloat(v.price);
        if (!v.name_tr.trim() || !Number.isFinite(price) || price <= 0) {
          setMsg('Her varyant için TR isim ve geçerli fiyat zorunludur.');
          return;
        }
        parsed.push({
          name_tr: v.name_tr.trim(),
          name_en: v.name_en.trim(),
          price,
          calories: v.calories ? parseInt(v.calories) : null,
        });
      }
      priceVariants = parsed;
      priceForDb = Math.min(...parsed.map((p) => p.price));
    } else if (!Number.isFinite(priceForDb) || priceForDb < 0) {
      setMsg('Geçerli bir fiyat girin.');
      return;
    }

    // Build nutrition jsonb from draft; NULL if nothing filled
    const nd = itemForm.nutrition;
    const nutritionPayload: Nutrition | null = (() => {
      const anyNumeric = NUTRITION_NUMERIC_KEYS.some((k) => (nd[k] || '').trim() !== '');
      const hasServing = nd.serving_size.trim() !== '';
      if (!anyNumeric && !hasServing) return null;
      const out: Nutrition = { show_on_menu: nd.show_on_menu };
      if (hasServing) out.serving_size = nd.serving_size.trim();
      for (const k of NUTRITION_NUMERIC_KEYS) {
        const raw = (nd[k] || '').trim();
        if (raw === '') continue;
        const num = parseFloat(raw);
        if (!Number.isFinite(num) || num < 0) continue;
        (out as Record<string, unknown>)[k] = num;
      }
      return out;
    })();

    // calories column stays in sync with nutrition.calories (or clears when
    // nutrition is blank)
    const caloriesForDb: number | null = nutritionPayload?.calories != null
      ? nutritionPayload.calories
      : null;

    setSaving(true);

    // If category changed during edit, append to the new category's end
    const movedCategory = editingItem && targetCategoryId !== selectedCat;
    const newSortOrder =
      movedCategory
        ? items.filter((i) => i.category_id === targetCategoryId).length
        : editingItem
        ? undefined
        : items.filter((i) => i.category_id === targetCategoryId).length;

    const payload = {
      restaurant_id: restaurant.id,
      category_id: targetCategoryId,
      name_tr: itemForm.name_tr,
      description_tr: itemForm.description_tr || null,
      price: priceForDb,
      price_variants: priceVariants,
      nutrition: nutritionPayload,
      nutri_score: itemForm.nutri_score || null,
      prep_time: itemForm.prep_time && Number.isFinite(parseInt(itemForm.prep_time))
        ? Math.max(1, Math.min(999, parseInt(itemForm.prep_time)))
        : null,
      image_url: itemForm.image_url || null,
      video_url: itemForm.video_url || null,
      calories: caloriesForDb,
      allergens: itemForm.allergens.length > 0 ? itemForm.allergens : null,
      is_vegetarian: itemForm.allergens.includes('vegetarian'),
      is_new: itemForm.is_new,
      is_featured: itemForm.is_featured,
      is_sold_out: itemForm.is_sold_out,
      schedule_type: itemForm.schedule_type,
      schedule_start: itemForm.schedule_type === 'date_range' && itemForm.schedule_start ? itemForm.schedule_start : null,
      schedule_end: itemForm.schedule_type === 'date_range' && itemForm.schedule_end ? itemForm.schedule_end : null,
      schedule_periodic: itemForm.schedule_type === 'periodic' ? itemForm.schedule_periodic : {},
      sort_order: newSortOrder,
      happy_hour_active: itemForm.happy_hour_active || false,
      happy_hour_price: itemForm.happy_hour_active && itemForm.happy_hour_price ? parseFloat(String(itemForm.happy_hour_price)) : null,
      happy_hour_label: itemForm.happy_hour_active && itemForm.happy_hour_label ? itemForm.happy_hour_label : null,
      happy_hour_days: itemForm.happy_hour_active && itemForm.happy_hour_days && itemForm.happy_hour_days.length > 0 ? itemForm.happy_hour_days : null,
      happy_hour_start_time: itemForm.happy_hour_active && itemForm.happy_hour_start_time ? itemForm.happy_hour_start_time : null,
      happy_hour_end_time: itemForm.happy_hour_active && itemForm.happy_hour_end_time ? itemForm.happy_hour_end_time : null,
    };

    let savedId = editingItem;
    const oldItem = editingItem ? items.find(i => i.id === editingItem) : null;

    if (editingItem) {
      const { sort_order, ...updatePayload } = payload;
      await supabase.from('menu_items').update(updatePayload).eq('id', editingItem);
    } else {
      const { data: newItem } = await supabase.from('menu_items').insert({ ...payload, translations: {} }).select().single();
      if (newItem) savedId = newItem.id;
    }

    // Medya kullanım takibi (used_in)
    if (savedId) {
      const newImg = itemForm.image_url || null;
      const oldImg = oldItem?.image_url || null;
      if (newImg !== oldImg) {
        if (oldImg) await detachMediaUsage(oldImg, { type: 'menu_item', id: savedId, field: 'image_url' });
        if (newImg) await attachMediaUsage(newImg, { type: 'menu_item', id: savedId, field: 'image_url', label: itemForm.name_tr });
      }
      const newVid = itemForm.video_url || null;
      const oldVid = oldItem?.video_url || null;
      if (newVid !== oldVid) {
        if (oldVid && oldVid.includes('/menu-images/')) await detachMediaUsage(oldVid, { type: 'menu_item', id: savedId, field: 'video_url' });
        if (newVid && newVid.includes('/menu-images/')) await attachMediaUsage(newVid, { type: 'menu_item', id: savedId, field: 'video_url', label: itemForm.name_tr });
      }
    }

    // Sync recommendations (table may not exist yet — swallow errors)
    if (savedId) {
      try {
        const { error: delErr } = await supabase.from('item_recommendations').delete().eq('menu_item_id', savedId);
        if (delErr && delErr.code !== 'PGRST116' && !/does not exist/i.test(delErr.message || '')) {
          console.warn('[item_recommendations delete]', delErr.message);
        }
        const recRows = itemForm.recommended_ids.slice(0, 5).map((rid, idx) => ({
          menu_item_id: savedId,
          recommended_item_id: rid,
          reason_tr: itemForm.recommendation_reasons[rid]?.tr || null,
          reason_en: itemForm.recommendation_reasons[rid]?.en || null,
          sort_order: idx,
        }));
        if (recRows.length > 0) {
          const { error: insErr } = await supabase.from('item_recommendations').insert(recRows);
          if (insErr) console.warn('[item_recommendations insert]', insErr.message);
        }
      } catch (e) {
        console.warn('[item_recommendations sync skipped]', e);
      }
    }

    // Keep the form open after save; just reset dirty snapshot and toast.
    if (!editingItem && savedId) {
      setEditingItem(savedId);
    }
    snapshotForm(itemForm);
    setMsg(editingItem ? 'Ürün güncellendi' : 'Ürün eklendi');
    setTimeout(() => setMsg(''), 3000);
    loadItems(restaurant.id);

    if (savedId && enabledLangs.length > 0) {
      setTranslating(savedId);
      await triggerTranslation('menu_items', savedId, enabledLangs);
      setTranslating(null);
      loadItems(restaurant.id);
    }

    setSaving(false);
  }
  async function deleteItem(id: string) {
    if (!restaurant || !confirm('Bu ürün silinecek. Emin misiniz?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    loadItems(restaurant.id);
  }
  async function toggleItemAvailable(id: string, current: boolean) {
    if (!restaurant) return;
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    loadItems(restaurant.id);
  }
  function snapshotForm(form: typeof itemForm) {
    initialFormJsonRef.current = JSON.stringify(form);
  }
  const hasUnsavedChanges = (() => {
    if (!showItemForm) return false;
    return JSON.stringify(itemForm) !== initialFormJsonRef.current;
  })();

  function openNewItemForm(catId: string) {
    if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
    setSelectedCat(catId);
    setShowItemForm(true);
    setEditingItem(null);
    const fresh = { ...emptyItemForm, category_id: catId };
    setItemForm(fresh);
    snapshotForm(fresh);
  }

  function handleItemClick(item: MenuItem) {
    if (showItemForm && editingItem === item.id) {
      if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
      setShowItemForm(false);
      setEditingItem(null);
      setItemForm(emptyItemForm);
      initialFormJsonRef.current = '';
      return;
    }
    if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
    startEdit(item);
  }

  function closeItemForm() {
    if (hasUnsavedChanges && !confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
    setShowItemForm(false);
    setEditingItem(null);
    setItemForm(emptyItemForm);
    initialFormJsonRef.current = '';
  }

  async function startEdit(item: MenuItem) {
    setEditingItem(item.id);
    let recs: any[] | null = null;
    try {
      const { data } = await supabase
        .from('item_recommendations')
        .select('recommended_item_id, reason_tr, reason_en, sort_order')
        .eq('menu_item_id', item.id)
        .order('sort_order');
      recs = data;
    } catch (e) {
      console.warn('[item_recommendations load skipped]', e);
    }
    const recommended_ids = (recs ?? []).map((r: any) => r.recommended_item_id as string);
    const recommendation_reasons: Record<string, { tr: string; en: string }> = {};
    for (const r of recs ?? []) {
      recommendation_reasons[r.recommended_item_id] = {
        tr: r.reason_tr ?? '',
        en: r.reason_en ?? '',
      };
    }
    const baseSchedule = defaultPeriodicSchedule();
    const mergedPeriodic = { ...baseSchedule };
    if (item.schedule_periodic) {
      for (const day of PERIODIC_DAYS) {
        const v = (item.schedule_periodic as Record<string, { enabled?: boolean; start?: string; end?: string; all_day?: boolean }>)[day];
        if (v) {
          mergedPeriodic[day] = {
            enabled: !!v.enabled,
            start: v.start || '09:00',
            end: v.end || '17:00',
            all_day: !!v.all_day,
          };
        }
      }
    }
    const variantDrafts: VariantDraft[] = Array.isArray(item.price_variants)
      ? item.price_variants.map((v) => ({
          name_tr: v.name_tr || '',
          name_en: v.name_en || '',
          price: v.price != null ? v.price.toString() : '',
          calories: v.calories != null ? v.calories.toString() : '',
        }))
      : [];

    // Hydrate nutrition draft: if item has nutrition use it, otherwise fall
    // back to legacy calories column so nothing silently disappears.
    const srcNutr = item.nutrition;
    const nutrDraft: NutritionDraft = emptyNutritionDraft();
    if (srcNutr && typeof srcNutr === 'object') {
      nutrDraft.show_on_menu = srcNutr.show_on_menu !== false;
      nutrDraft.serving_size = srcNutr.serving_size || '';
      for (const key of NUTRITION_NUMERIC_KEYS) {
        const val = (srcNutr as Record<string, unknown>)[key];
        if (typeof val === 'number') nutrDraft[key] = val.toString();
      }
    } else if (item.calories != null) {
      nutrDraft.calories = item.calories.toString();
    }
    const nutritionOpen = !!srcNutr;
    const nextForm = {
      name_tr: item.name_tr,
      description_tr: item.description_tr || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      video_url: item.video_url || '',
      recommended_ids,
      recommendation_reasons,
      allergens: item.allergens || [],
      is_vegetarian: item.is_vegetarian || false,
      is_new: item.is_new || false,
      is_featured: item.is_featured || false,
      is_sold_out: item.is_sold_out || false,
      schedule_type: item.schedule_type || 'always',
      schedule_start: item.schedule_start ? item.schedule_start.slice(0, 16) : '',
      schedule_end: item.schedule_end ? item.schedule_end.slice(0, 16) : '',
      schedule_periodic: mergedPeriodic,
      category_id: item.category_id,
      variants: variantDrafts,
      nutrition: nutrDraft,
      nutritionOpen,
      nutri_score: (item.nutri_score ?? '') as '' | 'A' | 'B' | 'C' | 'D' | 'E',
      prep_time: item.prep_time != null ? item.prep_time.toString() : '',
      happy_hour_active: (item as any).happy_hour_active || false,
      happy_hour_price: (item as any).happy_hour_price != null ? String((item as any).happy_hour_price) : '',
      happy_hour_label: (item as any).happy_hour_label || '',
      happy_hour_days: (item as any).happy_hour_days || null,
      happy_hour_start_time: (item as any).happy_hour_start_time ? String((item as any).happy_hour_start_time).slice(0, 5) : '',
      happy_hour_end_time: (item as any).happy_hour_end_time ? String((item as any).happy_hour_end_time).slice(0, 5) : '',
      happyHourOpen: !!(item as any).happy_hour_active,
    };
    setItemForm(nextForm);
    snapshotForm(nextForm);
    setShowItemForm(true);
    setSelectedCat(item.category_id);
  }

  // --- Inline price edit helper ---
  async function updateItemPrice(itemId: string, newPrice: number) {
    const prev = items;
    setItems(prev.map(it => it.id === itemId ? { ...it, price: newPrice } : it));
    const { error } = await supabase.from('menu_items').update({ price: newPrice }).eq('id', itemId);
    if (error) {
      setItems(prev);
      setMsg('Fiyat güncellenemedi: ' + error.message);
    }
  }

  // --- Sold-out toggle helper ---
  async function toggleSoldOut(itemId: string, current: boolean) {
    const prev = items;
    setItems(prev.map(it => it.id === itemId ? { ...it, is_sold_out: !current } : it));
    const { error } = await supabase.from('menu_items').update({ is_sold_out: !current }).eq('id', itemId);
    if (error) {
      setItems(prev);
      setMsg('Tükendi durumu güncellenemedi');
    }
  }
  function toggleAllergen(val: string) {
    setItemForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(val)
        ? prev.allergens.filter(a => a !== val)
        : [...prev.allergens, val]
    }));
  }

  function TranslationBadges({ translations }: { translations: Translations }) {
    if (!translations || Object.keys(translations).length === 0) return null;
    return (
      <span style={{ display: 'inline-flex', gap: 3, marginLeft: 6 }}>
        {Object.keys(translations).map(lang => (
          <span key={lang} style={{ ...S.badge, background: '#EEF2FF', color: '#4338CA', fontSize: 9 }}>
            {lang.toUpperCase()}
          </span>
        ))}
      </span>
    );
  }

  if (trialExpired) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5', padding: 16 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <TabbledLogo logoType="vertical" sizeClass="h-16" />
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginTop: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Warning size={28} weight="regular" color="#EF4444" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', marginBottom: 8 }}>
              Deneme Süreniz Doldu
            </h2>
            <p style={{ fontSize: 14, color: '#6B6B6F', marginBottom: 24, lineHeight: 1.5 }}>
              14 günlük ücretsiz deneme süreniz sona erdi. Tabbled'ı kullanmaya devam etmek için bir plan seçin.
            </p>
            <a
              href="/iletisim?plan=basic&source=trial_expired"
              style={{
                display: 'block', width: '100%', padding: '11px 20px', fontSize: 14, fontWeight: 600,
                color: '#FFFFFF', background: '#10B981', border: 'none', borderRadius: 8,
                textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
              }}
            >
              Plan Seçin
            </a>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              style={{
                display: 'block', width: '100%', marginTop: 12, padding: '11px 20px',
                fontSize: 13, color: '#A0A0A0', background: 'none', border: 'none',
                cursor: 'pointer',
              }}
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingData) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <CategoryTabSkeleton />
      <div style={{ marginTop: 16 }}>
        <ListSkeleton rows={5} />
      </div>
    </div>
  );

  if (!restaurant) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', marginBottom: 8 }}>Restoran Atanmadı</h2>
      <p style={{ fontSize: 14, color: '#6B6B6F' }}>Hesabınıza henüz bir restoran atanmamış. Lütfen yönetici ile iletişime geçin.</p>
    </div>
  );

  // Category id → ids including direct children (for parent selection)
  const categoryScopeIds = (catId: string): string[] => {
    const children = categories.filter(c => c.parent_id === catId).map(c => c.id);
    return [catId, ...children];
  };
  const filteredItems = (() => {
    let list = selectedCat
      ? items.filter(i => categoryScopeIds(selectedCat).includes(i.category_id))
      : items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i =>
        i.name_tr.toLowerCase().includes(q) ||
        (i.description_tr && i.description_tr.toLowerCase().includes(q))
      );
    }
    return list;
  })();
  // Eksik fotoğraf hesaplama
  const missingPhotoCounts = new Map<string, number>();
  for (const item of items) {
    if (!item.image_url) {
      missingPhotoCounts.set(item.category_id, (missingPhotoCounts.get(item.category_id) || 0) + 1);
    }
  }
  const totalMissingPhotos = items.filter(i => !i.image_url).length;
  const catName = (id: string) => categories.find(c => c.id === id)?.name_tr || '';

  const sidebarGroups = [
    {
      title: '',
      items: [
        { key: 'dashboard' as const, label: 'Dashboard', icon: ChartBar },
      ],
    },
    {
      title: 'Menü Yönetimi',
      items: [
        { key: 'menu' as const, label: 'Menü', icon: SquaresFour },
        { key: 'translations' as const, label: 'Çeviri Merkezi', icon: Globe },
        { key: 'qr' as const, label: 'QR Kodları', icon: Rows },
      ],
    },
    {
      title: 'AI Araçları',
      items: [
        { key: 'import' as const, label: 'Menü İçe Aktar', icon: FileArrowUp },
        { key: 'media' as const, label: 'Medya Kütüphanesi', icon: Images },
      ],
    },
    {
      title: 'Müşteri İlişkileri',
      items: [
        { key: 'customers' as const, label: 'Müşteriler', icon: Users },
        { key: 'calls' as const, label: 'Çağrılar', icon: Bell, badge: pendingCallCount },
        { key: 'bildirimler' as const, label: 'Bildirimler', icon: Bell },
        { key: 'feedback' as const, label: 'Geri Bildirim', icon: ChatCircle },
        { key: 'likes' as const, label: 'Beğeniler', icon: Heart },
        { key: 'promos' as const, label: 'Promosyonlar', icon: Tag },
      ],
    },
    {
      title: 'Pazarlama',
      items: [
        { key: 'discounts' as const, label: 'İndirim Kodları', icon: Percent },
      ],
    },
    {
      title: 'Görünüm',
      items: [
        { key: 'profile' as const, label: 'Tema & Profil', icon: Palette },
      ],
    },
  ];

  const allSidebarItems = sidebarGroups.flatMap(g => g.items);
  const activeLabel = allSidebarItems.find(i => i.key === activeTab)?.label ?? 'Dashboard';

  // Inline item form renderer. Assigned during render by the IIFE below so we
  // can keep the large JSX tree in-place while calling it from inside the
  // category accordion.
  let renderItemForm: () => ReactNode = () => null;

  const handleSidebarNav = (key: typeof activeTab) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const renderSidebarContent = () => (
    <>
      {/* Header — restaurant branding */}
      <div className="sb-header">
        {restaurant.logo_url && (
          <img onError={handleImageError} src={getOptimizedImageUrl(restaurant.logo_url, 'thumbnail')} alt="" className="sb-header-logo" />
        )}
        <p className="sb-header-name">{restaurant.name}</p>
      </div>

      {/* Navigation groups */}
      <nav className="sb-nav flex-1 overflow-y-auto overflow-x-hidden">
        {sidebarGroups.map((group, gIdx) => (
          <div key={group.title || `grp-${gIdx}`} className="sb-group">
            <div className="sb-group-divider" aria-hidden="true" />
            {group.title && (
              <div className="sb-group-title" role="presentation">
                <span style={{ flex: 1, textAlign: 'left' }}>{group.title}</span>
              </div>
            )}
            {group.items.map((item) => {
              const active = activeTab === item.key;
              const Icon = item.icon;
              const badge = 'badge' in item ? (item as { badge?: number }).badge ?? 0 : 0;
              return (
                <button
                  key={item.key}
                  onClick={() => handleSidebarNav(item.key)}
                  onFocus={handleSidebarEnter}
                  className="sb-item"
                  data-active={active}
                  aria-label={item.label}
                >
                  <Icon size={20} weight="thin" className="sb-icon" />
                  <span className="sb-label">{item.label}</span>
                  {badge > 0 && <span className="sb-badge">{badge}</span>}
                  {badge > 0 && <span className="sb-dot" aria-hidden="true" />}
                  <span className="sb-tooltip" role="tooltip">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer — public menu link + user menu */}
      <div className="sb-foot-wrap">
        <a
          href={`/menu/${restaurant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="sb-footer"
          title={`tabbled.com/menu/${restaurant.slug}`}
        >
          <Link size={13} />
          <span className="sb-footer-label">tabbled.com/menu/{restaurant.slug}</span>
        </a>
        <div className="sb-user">
          <div className="sb-user-avatar" aria-hidden="true">
            {(user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <span className="sb-user-email" title={user?.email ?? ''}>{user?.email ?? ''}</span>
          <button
            type="button"
            onClick={async () => { await signOut(); window.location.href = '/login'; }}
            className="sb-user-logout"
            aria-label="Çıkış"
            title="Çıkış"
          >
            <span className="sb-user-logout-label">Çıkış</span>
            <X size={14} weight="thin" className="sb-user-logout-icon" />
          </button>
        </div>
      </div>
    </>
  );

  const desktopCollapsed = !sidebarHovered;
  const desktopRailWidth = desktopCollapsed ? 64 : 240;

  return (
    <div className="min-h-screen relative" data-admin-theme={restaurant?.admin_theme === 'dark' ? 'dark' : 'light'} style={{ backgroundColor: '#FAFAF9', color: adminTheme.value }}>
      {/* Desktop Sidebar — fixed overlay rail, expands on hover (>=1024) */}
      {isDesktop && (
        <aside
          className="sb-rail flex flex-col"
          data-collapsed={desktopCollapsed}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            width: desktopRailWidth,
            zIndex: 40,
            transition: 'width 180ms ease',
          }}
          onMouseEnter={handleSidebarEnter}
          onMouseLeave={handleSidebarLeave}
        >
          {renderSidebarContent()}
        </aside>
      )}

      {/* Drawer (<1024) — slides in from left */}
      {!isDesktop && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />
          <aside className="sb-rail relative z-10 flex flex-col w-[280px] min-h-screen shadow-2xl animate-sidebar-slide-in" data-collapsed={false}>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main content — padded to clear the fixed desktop rail (64px) */}
      <main
        className="flex-1 min-w-0"
        style={{
          paddingLeft: isDesktop ? 64 : 0,
          minHeight: '100vh',
          background: '#FAFAF9',
        }}
      >

        <div style={S.wrap}>
          {plan === 'basic' && !trialExpired && (() => {
            const pillUrgent = trialDaysLeft !== null && trialDaysLeft <= 3;
            const pillTrial = trialDaysLeft !== null;
            const pillBg = pillUrgent ? '#FEF2F2' : pillTrial ? '#ECFDF5' : '#F3F4F6';
            const pillColor = pillUrgent ? '#991B1B' : pillTrial ? '#065F46' : '#374151';
            const pillText = !pillTrial
              ? 'BASIC'
              : trialDaysLeft === 0
                ? 'BASIC DENEME · Bugün bitiyor'
                : `BASIC DENEME · ${trialDaysLeft} gün kaldı`;
            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  marginBottom: 16,
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '12px 16px',
                  flexWrap: 'wrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      background: pillBg,
                      color: pillColor,
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '4px 10px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.3px',
                      fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    {pillText}
                  </span>
                  <span style={{ fontSize: 14, color: '#6B7280', flex: 1, minWidth: 0, fontFamily: "'Roboto', sans-serif" }}>
                    Tüm özelliklere erişim için Premium'a yükseltin.
                  </span>
                </div>
                <a
                  href="/iletisim?plan=premium&source=upgrade_banner"
                  style={{
                    background: '#FF4F7A',
                    color: '#FFFFFF',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Roboto', sans-serif",
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E63E68')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#FF4F7A')}
                >
                  Yükselt
                </a>
              </div>
            );
          })()}

          {activeTab === 'dashboard' && (
            <RestaurantAnalytics
              restaurantId={restaurant.id}
              featureWaiterCalls={hasFeature(restaurant, 'waiter_calls')}
              featureFeedback={hasFeature(restaurant, 'feedback')}
              featureReviews={restaurant.feature_reviews !== false}
              onNavigate={(tab) => setActiveTab(tab as typeof activeTab)}
            />
          )}
          {activeTab === 'profile' && (
            <>
              <ProfileTab restaurant={restaurant} onUpdate={(r) => setRestaurant(r)} theme={adminTheme} />
              <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
                <LegalSettings
                  restaurantId={restaurant.id}
                  initialPriceEffectiveDate={restaurant.price_effective_date ?? null}
                  initialShowVatNotice={restaurant.show_vat_notice ?? true}
                />
              </div>
            </>
          )}
      {activeTab === 'qr' && <QRManager restaurant={restaurant} theme={adminTheme} />}
      {activeTab === 'media' && <MediaLibrary restaurantId={restaurant.id} restaurantSlug={restaurant.slug} theme={adminTheme} />}
      {activeTab === 'import' && <MenuImport restaurantId={restaurant.id} baseCurrency={restaurant.base_currency} theme={adminTheme} onImported={() => loadCategories(restaurant.id)} />}
      {activeTab === 'promos' && <PromosTab restaurant={restaurant} theme={adminTheme} />}
      {activeTab === 'calls' && <WaiterCallsPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'bildirimler' && <NotificationsPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'feedback' && <FeedbackPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'customers' && <CustomersPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'discounts' && <DiscountCodesPanel restaurantId={restaurant.id} baseCurrency={restaurant.base_currency} theme={adminTheme} />}
      {activeTab === 'likes' && <LikesPanel restaurantId={restaurant.id} theme={adminTheme} />}
      {activeTab === 'translations' && (
        <TranslationCenter
          restaurantId={restaurant.id}
          enabledLanguages={restaurant.enabled_languages ?? ['tr']}
          onEnabledLanguagesChange={(langs) =>
            setRestaurant({ ...restaurant, enabled_languages: langs })
          }
          theme={restaurant?.admin_theme === 'dark' ? 'dark' : 'light'}
        />
      )}

      {activeTab === 'menu' && (
        <>
          {translating && (
            <div style={{ padding: '8px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, color: '#4338CA', fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={14} /> Çeviriler oluşturuluyor...
            </div>
          )}

          {msg && <div style={{ padding: '10px 14px', background: msg.includes('oluşturuldu') ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${msg.includes('oluşturuldu') ? '#DCFCE7' : '#FECACA'}`, borderRadius: 8, color: msg.includes('oluşturuldu') ? '#22C55E' : '#EF4444', fontSize: 13, marginBottom: 16 }} onClick={() => setMsg('')}>{msg} <span style={{ float: 'right', cursor: 'pointer' }}>✕</span></div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: adminTheme.value }}>Kategoriler</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {restaurant && (
                <PDFDownloadButton
                  restaurant={{
                    id: restaurant.id,
                    name: restaurant.name,
                    address: restaurant.address ?? null,
                    logo_url: restaurant.logo_url ?? null,
                    price_effective_date: restaurant.price_effective_date ?? null,
                    show_vat_notice: restaurant.show_vat_notice ?? true,
                  }}
                  categories={categories}
                  items={items}
                  currency={restaurant.base_currency || 'TRY'}
                  currencySymbol={baseSymbol}
                  defaultLangCode="tr"
                />
              )}
              <button onClick={() => setShowCatForm(!showCatForm)} style={S.btnSm}>{showCatForm ? 'İptal' : '+ Kategori'}</button>
            </div>
          </div>

          {showCatForm && (
            <form onSubmit={addCategory} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={S.label}>Kategori Adı *</label>
                <input style={S.input} value={catForm.name_tr} onChange={e => setCatForm({ ...catForm, name_tr: e.target.value })} required placeholder="Örn: Ana Yemekler" />
              </div>
              <div>
                <label style={S.label}>Üst Kategori</label>
                <select
                  style={S.input}
                  value={catForm.parent_id || ''}
                  onChange={e => setCatForm({ ...catForm, parent_id: e.target.value || null })}
                >
                  <option value="">Ana Kategori (Yok)</option>
                  {categories.filter(c => !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name_tr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Kategori Görseli</label>
                {catForm.image_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img onError={handleImageError} src={getOptimizedImageUrl(catForm.image_url, 'thumbnail')} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E5E3' }} />
                    <button type="button" onClick={() => openPicker('image', (url) => setCatForm(prev => ({ ...prev, image_url: url })))} style={{ ...S.btnSm, fontSize: 11 }}>Değiştir</button>
                    <button type="button" onClick={() => setCatForm({ ...catForm, image_url: '' })} style={{ ...S.btnDanger, fontSize: 11 }}><Trash size={12} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => openPicker('image', (url) => setCatForm(prev => ({ ...prev, image_url: url })))} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Image size={14} /> Kütüphaneden Seç
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: adminTheme.subtle, marginTop: 4 }}><Info size={14} /><span>800×600px, yatay, max 5MB</span></div>
              </div>
              <div>
                <label style={S.label}><VideoCamera size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Video (opsiyonel)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <button type="button" onClick={() => openPicker('video', (url) => setCatForm(prev => ({ ...prev, video_url: url })))} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <VideoCamera size={14} /> Kütüphaneden Video Seç
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    value={catForm.video_url}
                    onChange={e => setCatForm({ ...catForm, video_url: e.target.value })}
                    placeholder="veya https://... YouTube/Vimeo linki yapıştırın"
                  />
                  {catForm.video_url && (
                    <button
                      type="button"
                      onClick={() => setCatForm({ ...catForm, video_url: '' })}
                      style={{ ...S.btnSm, padding: '6px 10px', fontSize: 11, color: '#EF4444' }}
                      title="Video URL'ini kaldır"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {catForm.video_url && (() => {
                  const v = catForm.video_url.trim();
                  const yt = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
                  const vm = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                  const isDirect = /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(v);
                  return (
                    <>
                      <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxWidth: 320, border: '1px solid #E5E5E3' }}>
                        {yt ? <iframe src={`https://www.youtube.com/embed/${yt[1]}`} style={{ width: '100%', aspectRatio: '16/9', border: 'none' }} allow="encrypted-media" />
                          : vm ? <iframe src={`https://player.vimeo.com/video/${vm[1]}`} style={{ width: '100%', aspectRatio: '16/9', border: 'none' }} allow="encrypted-media" />
                          : <video src={v} controls muted playsInline preload="metadata" style={{ width: '100%', maxHeight: 240 }} />}
                      </div>
                      {!isDirect && (yt || vm) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '6px 8px', marginTop: 6 }}>
                          <Warning size={14} /><span>Kategori kartlarında sadece .mp4/.webm dosya URL'leri desteklenir. YouTube/Vimeo linkleri bento kartta oynatılmaz.</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: adminTheme.subtle, marginTop: 4 }}><Info size={14} /><span>3-5 saniyelik kısa loop video önerilir</span></div>
              </div>
              <button type="submit" disabled={saving} style={{ ...S.btn, alignSelf: 'flex-start' }}>{saving ? '...' : 'Ekle'}</button>
            </form>
          )}

          {/* Summary line */}
          <div style={{ fontSize: 13, color: adminTheme.heading, marginBottom: 10 }}>
            Toplam: <b style={{ color: adminTheme.value }}>{items.length}</b> ürün
            {totalMissingPhotos > 0 && <> · <span style={S.missingPhotoWarning}>{totalMissingPhotos} fotoğraf eksik</span></>}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
            <input
              style={{ ...S.input, flex: 1 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Bir ürün veya kategori ara..."
            />
          </div>

          {(() => { renderItemForm = () => (
            <form onSubmit={addOrUpdateItem} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10, background: '#F7F7F5', borderLeft: '3px solid #1C1C1E' }}>
              <div>
                <label style={S.label}>Kategori *</label>
                <select
                  style={S.input}
                  value={itemForm.category_id || selectedCat}
                  onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                  required
                >
                  {(() => {
                    const options: React.ReactElement[] = [];
                    const parents = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
                    for (const p of parents) {
                      const kids = categories.filter(c => c.parent_id === p.id).sort((a, b) => a.sort_order - b.sort_order);
                      // Parent is selectable only when it has no children (items can live there directly)
                      if (kids.length === 0) {
                        options.push(<option key={p.id} value={p.id}>{p.name_tr}</option>);
                      } else {
                        options.push(
                          <option key={p.id} value={p.id} disabled>
                            {p.name_tr}
                          </option>,
                        );
                        for (const k of kids) {
                          options.push(
                            <option key={k.id} value={k.id}>
                              {'\u00A0\u00A0\u00A0\u00A0— '}{k.name_tr}
                            </option>,
                          );
                        }
                      }
                    }
                    return options;
                  })()}
                </select>
              </div>
              <div>
                <label style={S.label}>Ürün Adı *</label>
                <input style={S.input} value={itemForm.name_tr} onChange={e => setItemForm({ ...itemForm, name_tr: e.target.value })} required placeholder="Örn: Mercimek Çorbası" />
              </div>
              <div>
                {/* AI Açıklama Yazıcı header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={S.label}>Açıklama (TR)</label>
                  {hasAI && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <select
                        value={aiTone}
                        onChange={e => setAiTone(e.target.value as 'elegant' | 'casual' | 'descriptive')}
                        style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: `1px solid ${adminTheme.border}`, backgroundColor: adminTheme.pageBg, color: adminTheme.heading, cursor: 'pointer' }}
                      >
                        <option value="descriptive">Detaylı</option>
                        <option value="elegant">Şık</option>
                        <option value="casual">Samimi</option>
                      </select>
                      <button
                        type="button"
                        onClick={generateAIDescription}
                        disabled={generatingAI || !itemForm.name_tr}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: generatingAI ? '#E5E5E3' : '#10B981', color: generatingAI ? '#999' : '#fff', cursor: generatingAI ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: !itemForm.name_tr ? 0.5 : 1, fontFamily: "'Roboto', sans-serif" }}
                        title="AI ile açıklama oluştur"
                      >
                        {generatingAI ? (
                          <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Yazılıyor...</>
                        ) : (
                          <><Pen size={14} /> AI ile Yaz</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {hasAI && (
                  <div style={{ fontSize: 11, color: adminTheme.subtle, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkle size={11} /> {AI_CREDIT_COSTS.menuDescription} kredi kullanılır · Kalan: {aiCredits.creditsRemaining}/{aiCredits.creditsTotal}
                  </div>
                )}

                {/* AI Önizleme */}
                {aiPreview && (
                  <div style={{ padding: 12, marginBottom: 8, borderRadius: 8, border: '1px solid #10B98140', backgroundColor: '#ECFDF5' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#10B981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pen size={12} /> AI Önizleme
                    </div>
                    <div style={{ fontSize: 13, color: adminTheme.value, lineHeight: 1.5, marginBottom: 8 }}>
                      {aiPreview}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={acceptAiDescription} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer' }}>
                        Kullan
                      </button>
                      <button type="button" onClick={generateAIDescription} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${adminTheme.border}`, backgroundColor: adminTheme.cardBg, color: adminTheme.heading, cursor: 'pointer' }}>
                        Tekrar Üret
                      </button>
                      <button type="button" onClick={() => setAiPreview(null)} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: adminTheme.subtle, cursor: 'pointer' }}>
                        İptal
                      </button>
                    </div>
                  </div>
                )}

                <Suspense fallback={
                  <div style={{ ...S.input, minHeight: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', color: adminTheme.subtle, fontSize: 12, backgroundColor: adminTheme.inputBg, borderColor: adminTheme.inputBorder }}>
                    Editör yükleniyor...
                  </div>
                }>
                  <RichTextEditor
                    content={itemForm.description_tr}
                    onChange={(html) => setItemForm({ ...itemForm, description_tr: html })}
                    placeholder="Kısa bir açıklama yazın veya AI ile oluşturun"
                    minHeight={80}
                  />
                </Suspense>
              </div>
              {/* Single price vs variant mode */}
              {itemForm.variants.length === 0 ? (
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Fiyat ({baseSymbol}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      style={S.input}
                      value={itemForm.price}
                      onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setItemForm({
                          ...itemForm,
                          variants: [
                            { name_tr: '', name_en: '', price: itemForm.price || '', calories: '' },
                            { name_tr: '', name_en: '', price: '', calories: '' },
                          ],
                        })
                      }
                      style={{ ...S.btnSm, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <PlusCircle size={14} /> Varyant Ekle (Boyut)
                    </button>
                  </div>
                  <div>
                    <label style={S.label}>Görsel</label>
                    {itemForm.image_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img onError={handleImageError} src={getOptimizedImageUrl(itemForm.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        <button type="button" onClick={() => openPicker('image', (url) => setItemForm(prev => ({ ...prev, image_url: url })))} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11 }}>Değiştir</button>
                        <button type="button" onClick={() => setItemForm({ ...itemForm, image_url: '' })} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11, color: '#EF4444' }}>Kaldır</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => openPicker('image', (url) => setItemForm(prev => ({ ...prev, image_url: url })))} style={{ ...S.btnSm, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Image size={14} /> Kütüphaneden Seç
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>1200×800px, yatay, max 5MB</span></div>
                  </div>
                  <div>
                    <label style={S.label}>Video</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <button type="button" onClick={() => openPicker('video', (url) => setItemForm(prev => ({ ...prev, video_url: url })))} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <VideoCamera size={14} /> Kütüphaneden Video Seç
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        style={{ ...S.input, flex: 1 }}
                        value={itemForm.video_url}
                        onChange={e => setItemForm({ ...itemForm, video_url: e.target.value })}
                        placeholder="veya YouTube/Vimeo linki yapıştırın"
                      />
                      {itemForm.video_url && (
                        <button
                          type="button"
                          onClick={() => setItemForm({ ...itemForm, video_url: '' })}
                          style={{ ...S.btnSm, padding: '6px 10px', fontSize: 11, color: '#EF4444' }}
                          title="Video URL'ini kaldır"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {itemForm.video_url && (
                      <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxWidth: 320, border: '1px solid #E5E5E3' }}>
                        {(() => {
                          const v = itemForm.video_url.trim();
                          const yt = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
                          const vm = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                          if (yt) return <iframe src={`https://www.youtube.com/embed/${yt[1]}`} style={{ width: '100%', aspectRatio: '16/9', border: 'none' }} allow="encrypted-media" />;
                          if (vm) return <iframe src={`https://player.vimeo.com/video/${vm[1]}`} style={{ width: '100%', aspectRatio: '16/9', border: 'none' }} allow="encrypted-media" />;
                          return <video src={v} controls preload="metadata" style={{ width: '100%', maxHeight: 240 }} />;
                        })()}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>.mp4/.webm direkt URL veya YouTube/Vimeo linki — Storage'a yüklenmez</span></div>
                  </div>
                  <div>
                    <label style={S.label}>Önerilen Ürünler ({itemForm.recommended_ids.length}/5)</label>
                    {itemForm.recommended_ids.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                        {itemForm.recommended_ids.map((rid) => {
                          const recItem = items.find((it) => it.id === rid);
                          if (!recItem) return null;
                          const reasons = itemForm.recommendation_reasons[rid] || { tr: '', en: '' };
                          return (
                            <div key={rid} style={{ border: '1px solid #E5E5E3', borderRadius: 8, padding: 10, background: '#F7F7F5' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{recItem.name_tr}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next_ids = itemForm.recommended_ids.filter((x) => x !== rid);
                                    const next_reasons = { ...itemForm.recommendation_reasons };
                                    delete next_reasons[rid];
                                    setItemForm({ ...itemForm, recommended_ids: next_ids, recommendation_reasons: next_reasons });
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2, display: 'inline-flex' }}
                                  title="Kaldır"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <input
                                style={{ ...S.input, padding: '6px 10px', fontSize: 12, marginBottom: 4 }}
                                value={reasons.tr}
                                onChange={(e) => setItemForm({ ...itemForm, recommendation_reasons: { ...itemForm.recommendation_reasons, [rid]: { ...reasons, tr: e.target.value } } })}
                                placeholder="Neden? (TR) — ör: Acılı nachos'u serinleten bir eşlik"
                              />
                              <input
                                style={{ ...S.input, padding: '6px 10px', fontSize: 12 }}
                                value={reasons.en}
                                onChange={(e) => setItemForm({ ...itemForm, recommendation_reasons: { ...itemForm.recommendation_reasons, [rid]: { ...reasons, en: e.target.value } } })}
                                placeholder="Why? (EN) — optional"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {itemForm.recommended_ids.length < 5 && (
                      <select
                        style={S.input}
                        value=""
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) return;
                          if (itemForm.recommended_ids.includes(id)) return;
                          setItemForm({
                            ...itemForm,
                            recommended_ids: [...itemForm.recommended_ids, id],
                            recommendation_reasons: { ...itemForm.recommendation_reasons, [id]: { tr: '', en: '' } },
                          });
                        }}
                      >
                        <option value="">+ Öneri ekle...</option>
                        {items
                          .filter((it) => it.id !== editingItem && !itemForm.recommended_ids.includes(it.id))
                          .map((it) => (
                            <option key={it.id} value={it.id}>{it.name_tr}</option>
                          ))}
                      </select>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>Ürün detayında "Yanında İyi Gider" olarak gösterilir. Max 5.</span></div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...S.label, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PlusCircle size={14} /> Fiyat Varyantları
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Tüm varyantlar silinecek ve tek fiyata dönülecek. Devam edilsin mi?')) return;
                        const fallback = itemForm.variants[0]?.price || itemForm.price || '';
                        setItemForm({ ...itemForm, variants: [], price: fallback });
                      }}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Tek fiyata dön
                    </button>
                  </div>
                  {itemForm.variants.map((v, idx) => (
                    <div key={idx} style={{ border: '1px solid #E5E5E3', borderRadius: 8, padding: 10, background: '#F7F7F5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6F', textTransform: 'uppercase', letterSpacing: 0.5 }}>Varyant {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = itemForm.variants.filter((_, i) => i !== idx);
                            setItemForm({ ...itemForm, variants: next });
                          }}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                          title="Varyantı sil"
                          disabled={itemForm.variants.length <= 2}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      <div style={S.grid2}>
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>İsim (TR) *</label>
                          <input
                            style={{ ...S.input, padding: '6px 10px', fontSize: 13 }}
                            value={v.name_tr}
                            onChange={e => {
                              const next = [...itemForm.variants];
                              next[idx] = { ...next[idx], name_tr: e.target.value };
                              setItemForm({ ...itemForm, variants: next });
                            }}
                            placeholder="Küçük"
                            required
                          />
                        </div>
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>İsim (EN)</label>
                          <input
                            style={{ ...S.input, padding: '6px 10px', fontSize: 13 }}
                            value={v.name_en}
                            onChange={e => {
                              const next = [...itemForm.variants];
                              next[idx] = { ...next[idx], name_en: e.target.value };
                              setItemForm({ ...itemForm, variants: next });
                            }}
                            placeholder="Small"
                          />
                        </div>
                      </div>
                      <div style={{ ...S.grid2, marginTop: 6 }}>
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>Fiyat ({baseSymbol}) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            style={{ ...S.input, padding: '6px 10px', fontSize: 13 }}
                            value={v.price}
                            onChange={e => {
                              const next = [...itemForm.variants];
                              next[idx] = { ...next[idx], price: e.target.value };
                              setItemForm({ ...itemForm, variants: next });
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ ...S.label, fontSize: 11 }}>Kalori (kcal)</label>
                          <input
                            type="number"
                            style={{ ...S.input, padding: '6px 10px', fontSize: 13 }}
                            value={v.calories}
                            onChange={e => {
                              const next = [...itemForm.variants];
                              next[idx] = { ...next[idx], calories: e.target.value };
                              setItemForm({ ...itemForm, variants: next });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {itemForm.variants.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, variants: [...itemForm.variants, { name_tr: '', name_en: '', price: '', calories: '' }] })}
                      style={{ ...S.btnSm, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <PlusCircle size={14} /> Varyant Ekle
                    </button>
                  )}
                  {/* Görsel yine gerekli */}
                  <div>
                    <label style={S.label}>Görsel</label>
                    {itemForm.image_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img onError={handleImageError} src={getOptimizedImageUrl(itemForm.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        <button type="button" onClick={() => openPicker('image', (url) => setItemForm(prev => ({ ...prev, image_url: url })))} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11 }}>Değiştir</button>
                        <button type="button" onClick={() => setItemForm({ ...itemForm, image_url: '' })} style={{ ...S.btnSm, padding: '3px 8px', fontSize: 11, color: '#EF4444' }}>Kaldır</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => openPicker('image', (url) => setItemForm(prev => ({ ...prev, image_url: url })))} style={{ ...S.btnSm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Image size={14} /> Kütüphaneden Seç
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}><Info size={14} /><span>1200×800px, yatay, max 5MB</span></div>
                  </div>
                </div>
              )}
              <div>
                <label style={S.label}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Timer size={16} /> Hazırlanma Süresi
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    step={1}
                    placeholder="15"
                    value={itemForm.prep_time}
                    onChange={e => setItemForm({ ...itemForm, prep_time: e.target.value })}
                    style={{ ...S.input, width: 100 }}
                  />
                  <span style={{ fontSize: 13, color: '#6B6B6F' }}>dk</span>
                </div>
              </div>
              <div>
                <label style={S.label}>Alerjenler</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALLERGEN_OPTIONS.map(a => {
                    const selected = itemForm.allergens.includes(a.value);
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleAllergen(a.value)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          borderRadius: 20,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          border: selected ? '2px solid #10B981' : '1px solid #E5E5E3',
                          background: selected ? '#ECFDF5' : '#fff',
                          color: selected ? '#10B981' : '#2D2D2F',
                          fontWeight: selected ? 700 : 400,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={S.label}>Diyet Tercihleri</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DIET_OPTIONS.map(a => {
                    const selected = itemForm.allergens.includes(a.value);
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleAllergen(a.value)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          borderRadius: 20,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          border: selected ? '2px solid #10B981' : '1px solid #E5E5E3',
                          background: selected ? '#ECFDF5' : '#fff',
                          color: selected ? '#10B981' : '#2D2D2F',
                          fontWeight: selected ? 700 : 400,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
                  <input type="checkbox" checked={itemForm.is_new} onChange={e => setItemForm({ ...itemForm, is_new: e.target.checked })} />
                  <Star size={14} /> Yeni Ürün
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
                  <input type="checkbox" checked={itemForm.is_featured} onChange={e => setItemForm({ ...itemForm, is_featured: e.target.checked })} />
                  <Star size={14} style={{ color: '#10B981' }} /> Öne Çıkar
                </label>
              </div>
              {/* Sold-out toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#2D2D2F' }}>
                <input type="checkbox" checked={itemForm.is_sold_out} onChange={e => setItemForm({ ...itemForm, is_sold_out: e.target.checked })} />
                <XCircle size={14} /> Tükendi olarak işaretle
              </label>

              {/* Scheduling */}
              <div style={{ borderTop: '1px solid #E5E5E3', paddingTop: 12, marginTop: 4 }}>
                <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} /> Zamanlama
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {[
                    { v: 'always', label: 'Her zaman göster' },
                    { v: 'date_range', label: 'Zaman aralığı (başlangıç – bitiş)' },
                    { v: 'periodic', label: 'Periyodik (haftalık saat aralığı)' },
                  ].map(opt => (
                    <label key={opt.v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2D2D2F', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="schedule_type"
                        value={opt.v}
                        checked={itemForm.schedule_type === opt.v}
                        onChange={() => setItemForm({ ...itemForm, schedule_type: opt.v as 'always' | 'date_range' | 'periodic' })}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {itemForm.schedule_type === 'date_range' && (
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Başlangıç</label>
                      <input
                        type="datetime-local"
                        style={S.input}
                        value={itemForm.schedule_start}
                        onChange={e => setItemForm({ ...itemForm, schedule_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Bitiş</label>
                      <input
                        type="datetime-local"
                        style={S.input}
                        value={itemForm.schedule_end}
                        onChange={e => setItemForm({ ...itemForm, schedule_end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                {itemForm.schedule_type === 'periodic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {PERIODIC_DAYS.map(day => {
                      const d = itemForm.schedule_periodic[day];
                      return (
                        <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 110 }}>
                            <input
                              type="checkbox"
                              checked={d.enabled}
                              onChange={e => setItemForm({
                                ...itemForm,
                                schedule_periodic: { ...itemForm.schedule_periodic, [day]: { ...d, enabled: e.target.checked } },
                              })}
                            />
                            {PERIODIC_DAY_LABELS[day]}
                          </label>
                          {d.enabled && (
                            <>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="checkbox"
                                  checked={d.all_day}
                                  onChange={e => setItemForm({
                                    ...itemForm,
                                    schedule_periodic: {
                                      ...itemForm.schedule_periodic,
                                      [day]: {
                                        ...d,
                                        all_day: e.target.checked,
                                        start: e.target.checked ? '00:00' : d.start,
                                        end: e.target.checked ? '23:59' : d.end,
                                      },
                                    },
                                  })}
                                />
                                Tüm gün
                              </label>
                              {!d.all_day && (
                                <>
                                  <input
                                    type="time"
                                    value={d.start}
                                    onChange={e => setItemForm({
                                      ...itemForm,
                                      schedule_periodic: { ...itemForm.schedule_periodic, [day]: { ...d, start: e.target.value } },
                                    })}
                                    style={{ ...S.input, width: 100, padding: '4px 8px' }}
                                  />
                                  <span>–</span>
                                  <input
                                    type="time"
                                    value={d.end}
                                    onChange={e => setItemForm({
                                      ...itemForm,
                                      schedule_periodic: { ...itemForm.schedule_periodic, [day]: { ...d, end: e.target.value } },
                                    })}
                                    style={{ ...S.input, width: 100, padding: '4px 8px' }}
                                  />
                                </>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Happy Hour (collapsible) */}
              <div style={{ borderTop: '1px solid #E5E5E3', paddingTop: 12, marginTop: 4 }}>
                <div
                  onClick={() => setItemForm({ ...itemForm, happyHourOpen: !itemForm.happyHourOpen })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}
                >
                  <Tag size={16} style={{ color: '#10B981' }} />
                  Happy Hour
                  {itemForm.happy_hour_active && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 400 }}>(Aktif)</span>}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>{itemForm.happyHourOpen ? '▲' : '▼'}</span>
                </div>

                {itemForm.happyHourOpen && (
                  <div style={{ padding: 12, borderRadius: 8, border: '1px solid #E5E5E3', backgroundColor: '#F7F7F5', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 12, color: '#666' }}>Happy Hour Aktif</label>
                      <input type="checkbox" checked={itemForm.happy_hour_active || false} onChange={e => setItemForm({ ...itemForm, happy_hour_active: e.target.checked })} />
                    </div>

                    {itemForm.happy_hour_active && (
                      <>
                        {/* Label */}
                        <div>
                          <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Etiket (opsiyonel)</label>
                          <input type="text" value={itemForm.happy_hour_label || ''} onChange={e => setItemForm({ ...itemForm, happy_hour_label: e.target.value })} placeholder="Happy Hour" style={{ ...S.input, fontSize: 13 }} />
                          <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Boş bırakırsan "Happy Hour" yazılır</div>
                        </div>

                        {/* Price — single price mode */}
                        {itemForm.variants.length === 0 && (
                          <div>
                            <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>İndirimli Fiyat ({baseSymbol})</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>{itemForm.price} {baseSymbol}</span>
                              <span style={{ fontSize: 12, color: '#999' }}>→</span>
                              <input type="number" step="0.01" min="0" value={itemForm.happy_hour_price || ''} onChange={e => setItemForm({ ...itemForm, happy_hour_price: e.target.value })} placeholder="0.00" style={{ ...S.input, width: 100, fontSize: 13 }} />
                              <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                                {itemForm.price && itemForm.happy_hour_price ? `%${Math.round((1 - parseFloat(String(itemForm.happy_hour_price)) / parseFloat(String(itemForm.price))) * 100)} indirim` : ''}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Price — variant mode */}
                        {itemForm.variants.length > 0 && (
                          <div>
                            <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Varyant İndirimli Fiyatları</label>
                            {itemForm.variants.map((v, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#666', minWidth: 80 }}>{v.name_tr}</span>
                                <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>{v.price} {baseSymbol}</span>
                                <span style={{ fontSize: 12, color: '#999' }}>→</span>
                                <input type="number" step="0.01" min="0" value={(v as any).happy_hour_price || ''} onChange={e => {
                                  const updated = [...itemForm.variants];
                                  updated[idx] = { ...updated[idx], happy_hour_price: e.target.value } as any;
                                  setItemForm({ ...itemForm, variants: updated });
                                }} placeholder="0.00" style={{ ...S.input, width: 80, fontSize: 13, padding: '4px 8px' }} />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Days */}
                        <div>
                          <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Günler (boş = her gün)</label>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {[{ key: 'mon', label: 'Pzt' }, { key: 'tue', label: 'Sal' }, { key: 'wed', label: 'Çar' }, { key: 'thu', label: 'Per' }, { key: 'fri', label: 'Cum' }, { key: 'sat', label: 'Cmt' }, { key: 'sun', label: 'Paz' }].map(day => {
                              const selected = (itemForm.happy_hour_days || []).includes(day.key);
                              return (
                                <button key={day.key} type="button" onClick={() => {
                                  const current = itemForm.happy_hour_days || [];
                                  const updated = selected ? current.filter(d => d !== day.key) : [...current, day.key];
                                  setItemForm({ ...itemForm, happy_hour_days: updated.length > 0 ? updated : null });
                                }} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, border: `1px solid ${selected ? '#10B981' : '#E5E5E3'}`, backgroundColor: selected ? '#10B981' : '#fff', color: selected ? '#fff' : '#666', cursor: 'pointer', fontWeight: selected ? 600 : 400 }}>
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Time range */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Başlangıç</label>
                            <input type="time" value={itemForm.happy_hour_start_time || ''} onChange={e => setItemForm({ ...itemForm, happy_hour_start_time: e.target.value })} style={{ ...S.input, fontSize: 13 }} />
                          </div>
                          <span style={{ marginTop: 20, color: '#999' }}>—</span>
                          <div>
                            <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Bitiş</label>
                            <input type="time" value={itemForm.happy_hour_end_time || ''} onChange={e => setItemForm({ ...itemForm, happy_hour_end_time: e.target.value })} style={{ ...S.input, fontSize: 13 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: '#999' }}>Gece yarısını geçebilir (örn: 22:00-02:00)</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Nutri-Score */}
              <div style={{ borderTop: '1px solid #E5E5E3', paddingTop: 12, marginTop: 4 }}>
                <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Gauge size={14} /> Nutri-Score (opsiyonel)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    style={{ ...S.input, flex: 1 }}
                    value={itemForm.nutri_score}
                    onChange={(e) => setItemForm({ ...itemForm, nutri_score: e.target.value as '' | 'A' | 'B' | 'C' | 'D' | 'E' })}
                  >
                    <option value="">Seçim yok</option>
                    {NUTRI_SCORE_VALUES.map((s) => (
                      <option key={s} value={s}>{s} — {s === 'A' ? 'Çok iyi' : s === 'B' ? 'İyi' : s === 'C' ? 'Orta' : s === 'D' ? 'Düşük' : 'Kötü'}</option>
                    ))}
                  </select>
                  {itemForm.nutri_score && (
                    <span
                      aria-hidden
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: NUTRI_SCORE_COLORS[itemForm.nutri_score],
                        color: itemForm.nutri_score === 'C' ? '#1C1C1E' : '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {itemForm.nutri_score}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A0A0A0', marginTop: 4 }}>
                  <Info size={14} /><span>Menüde kcal'in yanında küçük renkli etiket olarak gösterilir.</span>
                </div>
              </div>

              {/* Nutrition Facts (collapsible) */}
              <div style={{ borderTop: '1px solid #E5E5E3', paddingTop: 12, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setItemForm({ ...itemForm, nutritionOpen: !itemForm.nutritionOpen })}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#1C1C1E',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <Grains size={16} /> Besin Değerleri
                    {!itemForm.nutritionOpen && itemForm.nutrition.calories && (
                      <span style={{ ...S.badge, background: '#EEF2FF', color: '#4338CA', marginLeft: 6 }}>
                        {itemForm.nutrition.calories} kcal
                      </span>
                    )}
                  </span>
                  {itemForm.nutritionOpen ? <CaretCircleUp size={18} /> : <CaretCircleDown size={18} />}
                </button>
                {itemForm.nutritionOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2D2D2F', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={itemForm.nutrition.show_on_menu}
                        onChange={e => setItemForm({ ...itemForm, nutrition: { ...itemForm.nutrition, show_on_menu: e.target.checked } })}
                      />
                      Menüde Göster
                    </label>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Porsiyon Boyutu</label>
                      <input
                        style={S.input}
                        value={itemForm.nutrition.serving_size}
                        onChange={e => setItemForm({ ...itemForm, nutrition: { ...itemForm.nutrition, serving_size: e.target.value } })}
                        placeholder="Örn: 1 porsiyon (250g)"
                      />
                    </div>

                    {(() => {
                      type NutrNumKey = typeof NUTRITION_NUMERIC_KEYS[number];
                      const setNutr = (k: NutrNumKey, val: string) =>
                        setItemForm({ ...itemForm, nutrition: { ...itemForm.nutrition, [k]: val } });
                      const numField = (k: NutrNumKey, label: string, unit: string) => (
                        <div key={k}>
                          <label style={{ ...S.label, fontSize: 11 }}>{label}</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              style={{ ...S.input, padding: '6px 10px', fontSize: 13, flex: 1 }}
                              value={itemForm.nutrition[k]}
                              onChange={e => setNutr(k, e.target.value)}
                            />
                            <span style={{ fontSize: 11, color: '#6B6B6F', minWidth: 26 }}>{unit}</span>
                          </div>
                        </div>
                      );
                      const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
                        <div style={{ border: '1px solid #E5E5E3', borderRadius: 8, padding: 10, background: '#F7F7F5' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6F', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            {title}
                          </div>
                          <div style={S.grid2}>{children}</div>
                        </div>
                      );
                      return (
                        <>
                          <Group title="Temel">
                            {numField('calories', 'Kalori', 'kcal')}
                            {numField('calories_from_fat', 'Yağdan Kalori', 'kcal')}
                          </Group>
                          <Group title="Yağlar">
                            {numField('total_fat', 'Toplam Yağ', 'g')}
                            {numField('saturated_fat', 'Doymuş Yağ', 'g')}
                            {numField('trans_fat', 'Trans Yağ', 'g')}
                          </Group>
                          <Group title="Diğer">
                            {numField('cholesterol', 'Kolesterol', 'mg')}
                            {numField('sodium', 'Sodyum', 'mg')}
                          </Group>
                          <Group title="Karbonhidratlar">
                            {numField('total_carb', 'Toplam Karbonhidrat', 'g')}
                            {numField('dietary_fiber', 'Lif', 'g')}
                            {numField('sugars', 'Şeker', 'g')}
                          </Group>
                          <div>
                            {numField('protein', 'Protein', 'g')}
                          </div>
                          <Group title="Vitaminler & Mineraller (% GRD)">
                            {numField('vitamin_a', 'A Vitamini', '%')}
                            {numField('vitamin_c', 'C Vitamini', '%')}
                            {numField('calcium', 'Kalsiyum', '%')}
                            {numField('iron', 'Demir', '%')}
                          </Group>
                        </>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Tüm besin değerleri silinecek. Devam edilsin mi?')) return;
                        setItemForm({ ...itemForm, nutrition: emptyNutritionDraft() });
                      }}
                      style={{ ...S.btnDanger, alignSelf: 'flex-start', fontSize: 11 }}
                    >
                      <Trash size={12} /> Besin Değerlerini Temizle
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeItemForm} disabled={saving} style={{ ...S.btnSm, padding: '8px 16px' }}>İptal</button>
                <button type="submit" disabled={saving} style={{ ...S.btn }}>{saving ? '...' : editingItem ? 'Güncelle' : 'Ekle'}</button>
              </div>
            </form>
          ); return null; })()}

          {/* ================= FineDine-style Category Accordion ================= */}
          {(() => {
            const renderItemRow = (item: MenuItem, dragListeners?: Record<string, unknown>) => {
              const allergenKeys = (item.allergens || []).filter(a => getAllergenInfo(a));
              const isTranslating = translating === item.id;
              const faded = !item.is_available || item.is_sold_out;
              const isActiveForm = showItemForm && editingItem === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    ...S.itemRow,
                    opacity: faded ? 0.6 : 1,
                    background: isActiveForm ? '#eef2ff' : hoveredItem === item.id ? adminTheme.hoverBg : adminTheme.cardBg,
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleItemClick(item)}
                >
                  {dragListeners && !isActiveForm && (
                    <span
                      {...dragListeners}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'grab', color: '#A0A0A0', display: 'inline-flex', alignItems: 'center', touchAction: 'none', flexShrink: 0 }}
                      title="Sürükleyerek sırala"
                    >
                      <Package size={16} />
                    </span>
                  )}
                  {dragListeners && isActiveForm && (
                    <span style={{ width: 16, flexShrink: 0 }} />
                  )}
                  {item.image_url ? (
                    <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'card')} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} loading="lazy" decoding="async" />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: adminTheme.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: adminTheme.border, flexShrink: 0 }}>
                      <Camera size={20} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: adminTheme.value, textDecoration: item.is_sold_out ? 'line-through' : 'none' }}>{item.name_tr}</span>
                      {item.translations && Object.keys(item.translations).length > 0 && (
                        <span style={S.translationBadge}>EN</span>
                      )}
                      {item.is_sold_out && <span style={S.soldOutBadge}><XCircle size={10} /> Tükendi</span>}
                      {item.is_vegetarian && <span style={{ ...S.badge, background: '#DCFCE7', color: '#22C55E', marginRight: 0 }}><AppleLogo size={10} /></span>}
                      {item.is_new && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309', marginRight: 0 }}>Yeni</span>}
                      {item.is_featured && <span style={{ ...S.badge, background: '#fef3c7', color: '#b45309', marginRight: 0 }}>Öne Çıkan</span>}
                      {item.schedule_type !== 'always' && <span style={{ ...S.badge, background: '#dbeafe', color: '#1d4ed8', marginRight: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Clock size={10} />Zamanlı</span>}
                      {(item as any).happy_hour_active && <span style={{ ...S.badge, background: '#fffbeb', color: '#f59e0b', marginRight: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Tag size={10} />HH</span>}
                      {allergenKeys.length > 0 && (
                        <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }} title={allergenKeys.join(', ')}>
                          {allergenKeys.slice(0, 3).map(a => <AllergenIcon key={a} allergenKey={a} size={12} />)}
                        </span>
                      )}
                      {isTranslating && <span style={{ fontSize: 9, color: '#4338CA' }}><Globe size={10} /> Çevriliyor...</span>}
                    </div>
                    {item.description_tr && (
                      <div style={{ fontSize: 12, color: '#A0A0A0', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description_tr}
                      </div>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                    {Array.isArray(item.price_variants) && item.price_variants.length > 0 ? (
                      (() => {
                        const prices = item.price_variants.map(v => Number(v.price));
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                            title="Varyantları düzenle"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#1C1C1E',
                              textDecoration: item.is_sold_out ? 'line-through' : 'none',
                              background: '#fff',
                              border: '1px dashed #E5E5E3',
                              borderRadius: 6,
                              padding: '4px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            <Package size={13} />
                            {min.toFixed(0)} {baseSymbol} – {max.toFixed(0)} {baseSymbol}
                          </button>
                        );
                      })()
                    ) : isActiveForm ? (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A0', padding: '4px 8px' }}>
                        {Number(item.price).toFixed(2)} {baseSymbol}
                      </span>
                    ) : (
                      <InlinePrice value={Number(item.price)} isSoldOut={item.is_sold_out} onSave={(n) => updateItemPrice(item.id, n)} symbol={baseSymbol} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleItemAvailable(item.id, item.is_available); }}
                    style={toggleSwitchStyle(item.is_available)}
                    title={item.is_available ? 'Pasif yap' : 'Aktif yap'}
                  >
                    <span style={toggleKnobStyle(item.is_available)} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: hoveredItem === item.id ? '#EF4444' : 'transparent',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                      flexShrink: 0,
                    }}
                    title="Sil"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              );
            };

            const makeItemDragHandler = (catId: string) => (event: DragEndEvent) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              setItems(prev => {
                const inCat = prev.filter(i => i.category_id === catId);
                const others = prev.filter(i => i.category_id !== catId);
                const oldIndex = inCat.findIndex(i => i.id === active.id);
                const newIndex = inCat.findIndex(i => i.id === over.id);
                if (oldIndex < 0 || newIndex < 0) return prev;
                const reordered = arrayMove(inCat, oldIndex, newIndex);
                persistItemOrder(reordered);
                return [...others, ...reordered];
              });
            };

            const renderItemsSection = (catId: string) => {
              const catItems = items.filter(i => i.category_id === catId).sort((a, b) => a.sort_order - b.sort_order);
              const showNewFormHere = showItemForm && editingItem === null && selectedCat === catId;
              if (catItems.length === 0) {
                return (
                  <>
                    <div style={{ fontSize: 12, color: '#A0A0A0', padding: '12px 16px', fontStyle: 'italic' }}>
                      Bu kategoride henüz ürün yok.
                    </div>
                    {showNewFormHere && (
                      <div ref={formContainerRef} style={{ padding: '0 0 8px 0' }}>
                        {renderItemForm()}
                      </div>
                    )}
                  </>
                );
              }
              return (
                <>
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={makeItemDragHandler(catId)}>
                    <SortableContext items={catItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {catItems.map(item => (
                        <Fragment key={item.id}>
                          <Sortable id={item.id}>
                            {({ setNodeRef, style, attributes, listeners }) => (
                              <div ref={setNodeRef} style={style} {...attributes}>
                                {renderItemRow(item, listeners as Record<string, unknown>)}
                              </div>
                            )}
                          </Sortable>
                          {showItemForm && editingItem === item.id && (
                            <div ref={formContainerRef} style={{ padding: '0 0 8px 0' }}>
                              {renderItemForm()}
                            </div>
                          )}
                        </Fragment>
                      ))}
                    </SortableContext>
                  </DndContext>
                  {showNewFormHere && (
                    <div ref={formContainerRef} style={{ padding: '0 0 8px 0' }}>
                      {renderItemForm()}
                    </div>
                  )}
                </>
              );
            };

            const renderCategoryHeader = (
              c: Category,
              dragListeners: Record<string, unknown> | undefined,
              opts: { isSub?: boolean } = {}
            ) => {
              const isOpen = expandedCats.has(c.id);
              const totalInScope = items.filter(i => categoryScopeIds(c.id).includes(i.category_id)).length;
              const missing = missingPhotoCounts.get(c.id) || 0;
              const isEditing = editingCat === c.id;
              return (
                <div style={{ ...S.catAccordionRow, padding: opts.isSub ? '10px 14px' : '12px 16px' }}>
                  {dragListeners && (
                    <span
                      {...dragListeners}
                      style={{ cursor: 'grab', color: '#A0A0A0', display: 'inline-flex', alignItems: 'center', touchAction: 'none', flexShrink: 0 }}
                      title="Sürükleyerek sırala"
                    >
                      <Package size={16} />
                    </span>
                  )}
                  {c.image_url ? (
                    <img onError={handleImageError} src={getOptimizedImageUrl(c.image_url, 'thumbnail')} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: adminTheme.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: adminTheme.border, flexShrink: 0 }}>
                      <Camera size={18} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => !isEditing && toggleExpand(c.id)}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input style={{ ...S.input, width: 220, padding: '6px 10px', fontSize: 13 }} value={editCatForm.name_tr} onChange={e => setEditCatForm({ name_tr: e.target.value })} autoFocus />
                        <button onClick={() => updateCategory(c.id)} style={{ ...S.btnSm, padding: '4px 8px' }}><CheckCircle size={14} /></button>
                        <button onClick={() => setEditingCat(null)} style={{ ...S.btnSm, padding: '4px 8px' }}><XCircle size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: opts.isSub ? 13 : 15, fontWeight: 600, color: adminTheme.value }}>{c.name_tr}</span>
                          {c.translations && Object.keys(c.translations).length > 0 && <span style={S.translationBadge}>EN</span>}
                        </div>
                        <div style={{ fontSize: 11, color: adminTheme.heading, marginTop: 2 }}>
                          {totalInScope} ürün
                          {missing > 0 && <> · <span style={S.missingPhotoWarning}>{missing} fotoğraf eksik</span></>}
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div style={S.accordionActions} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openPicker('image', (url) => setCategoryImageFromPicker(c.id, url))}
                        style={{ background: 'none', border: 'none', color: '#A0A0A0', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}
                        title="Kategori görseli (kütüphaneden seç)"
                      >
                        <Image size={16} />
                      </button>
                      {c.image_url && (
                        <button onClick={() => removeCategoryImage(c.id)} style={{ background: 'none', border: 'none', color: '#A0A0A0', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Görseli kaldır"><Trash size={14} /></button>
                      )}
                      <button
                        type="button"
                        onClick={() => openPicker('video', (url) => setCategoryVideoFromPicker(c.id, url))}
                        style={{ background: 'none', border: 'none', color: c.video_url ? '#10B981' : '#A0A0A0', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}
                        title={c.video_url ? 'Video değiştir (kütüphaneden)' : 'Kategori videosu (kütüphaneden seç)'}
                      >
                        <VideoCamera size={16} weight={c.video_url ? 'fill' : 'regular'} />
                      </button>
                      {c.video_url && (
                        <button onClick={() => removeCategoryVideo(c.id)} style={{ background: 'none', border: 'none', color: '#A0A0A0', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Videoyu kaldır"><X size={14} /></button>
                      )}
                      <button onClick={() => { setEditingCat(c.id); setEditCatForm({ name_tr: c.name_tr }); }} style={{ background: 'none', border: 'none', color: '#A0A0A0', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Düzenle"><PencilSimple size={16} /></button>
                      <button onClick={() => deleteCategory(c.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }} title="Sil"><Trash size={16} /></button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(c.id)}
                        style={{ background: 'none', border: 'none', color: '#6B6B6F', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}
                        title={isOpen ? 'Kapat' : 'Aç'}
                      >
                        {isOpen ? <CaretCircleUp size={20} /> : <CaretCircleDown size={20} />}
                      </button>
                    </div>
                  )}
                </div>
              );
            };

            // Search mode: flat compact list
            if (searchQuery.trim()) {
              if (filteredItems.length === 0) {
                return <div style={{ textAlign: 'center', color: adminTheme.subtle, padding: 40, fontSize: 14 }}>Eşleşen ürün bulunamadı.</div>;
              }
              return (
                <div style={{ border: `1px solid ${adminTheme.border}`, borderRadius: 12, overflow: 'hidden', background: adminTheme.cardBg }}>
                  {filteredItems.map(item => renderItemRow(item))}
                </div>
              );
            }

            const rootCats = categories.filter(c => !c.parent_id);
            if (rootCats.length === 0) {
              return <div style={{ textAlign: 'center', color: adminTheme.subtle, padding: 40, fontSize: 14 }}>Henüz kategori eklenmedi.</div>;
            }

            return (
              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={rootCats.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {rootCats.map(c => {
                    const isOpen = expandedCats.has(c.id);
                    const childCats = categories.filter(cc => cc.parent_id === c.id).sort((a, b) => a.sort_order - b.sort_order);
                    return (
                      <Sortable key={c.id} id={c.id}>
                        {({ setNodeRef, style, attributes, listeners }) => (
                          <div ref={setNodeRef} style={style} {...attributes}>
                            {renderCategoryHeader(c, listeners as Record<string, unknown>)}
                            {isOpen && (
                              <div style={{ marginBottom: 12 }}>
                                {childCats.length > 0 ? (
                                  <div style={S.subCatWrap}>
                                    {/* Direct items under parent (if any) */}
                                    {items.some(i => i.category_id === c.id) && (
                                      <div style={{ ...S.itemsContainer, margin: '4px 0 8px 0' }}>
                                        {renderItemsSection(c.id)}
                                      </div>
                                    )}
                                    <DndContext
                                      sensors={dndSensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={(event) => handleChildCategoryDragEnd(c.id, event)}
                                    >
                                      <SortableContext items={childCats.map(cc => cc.id)} strategy={verticalListSortingStrategy}>
                                        {childCats.map(child => {
                                          const childOpen = expandedCats.has(child.id);
                                          return (
                                            <Sortable key={child.id} id={child.id}>
                                              {({ setNodeRef: setChildRef, style: childStyle, attributes: childAttrs, listeners: childListeners }) => (
                                                <div ref={setChildRef} style={childStyle} {...childAttrs}>
                                                  {renderCategoryHeader(child, childListeners as Record<string, unknown>, { isSub: true })}
                                                  {childOpen && (
                                                    <>
                                                      <div style={{ ...S.itemsContainer, marginLeft: 0 }}>
                                                        {renderItemsSection(child.id)}
                                                      </div>
                                                      <button
                                                        onClick={() => openNewItemForm(child.id)}
                                                        style={{ ...S.btnSm, marginLeft: 0, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                      >
                                                        <PlusCircle size={14} /> Ürün Ekle
                                                      </button>
                                                    </>
                                                  )}
                                                </div>
                                              )}
                                            </Sortable>
                                          );
                                        })}
                                      </SortableContext>
                                    </DndContext>
                                  </div>
                                ) : (
                                  <>
                                    <div style={S.itemsContainer}>
                                      {renderItemsSection(c.id)}
                                    </div>
                                    <button
                                      onClick={() => openNewItemForm(c.id)}
                                      style={{ ...S.btnSm, marginLeft: 36, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <PlusCircle size={14} /> Ürün Ekle
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Sortable>
                    );
                  })}
                </SortableContext>
              </DndContext>
            );
          })()}
        </>
      )}
        </div>
      </main>

      {/* Mobile bottom nav removed — replaced by hamburger sidebar drawer */}

      {restaurant && (
        <MediaPickerModal
          isOpen={picker !== null}
          accept={picker?.accept || 'all'}
          onClose={() => setPicker(null)}
          onSelect={({ url }) => {
            picker?.onPick(url);
            setPicker(null);
          }}
          restaurantId={restaurant.id}
          restaurantSlug={restaurant.slug}
          theme={adminTheme}
        />
      )}
    </div>
  );
}

