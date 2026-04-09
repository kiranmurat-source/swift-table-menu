/**
 * Strip all HTML tags from a string and return plain text.
 * Safe in both browser and fallback environments.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim();
  }
  // Fallback: simple tag strip
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Returns true if the HTML content is effectively empty
 * (e.g. "<p></p>", "<p><br></p>", whitespace-only).
 */
export function isHtmlEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  const text = stripHtml(html);
  return text === '';
}
