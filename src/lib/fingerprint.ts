export function getFingerprint(): string {
  const key = 'tabbled_fp';
  let fp = '';
  try {
    fp = sessionStorage.getItem(key) || '';
  } catch {}
  if (!fp) {
    fp = 'fp_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    try { sessionStorage.setItem(key, fp); } catch {}
  }
  return fp;
}
