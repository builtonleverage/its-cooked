import type { ImageCredit } from './types';

/**
 * Openly-licensed image search. Only free licences are accepted; anything with an
 * unknown or non-free licence is filtered out before the user ever sees it.
 */

const FREE = /^(cc0|cc[- ]by(?:[- ]sa)?(?:[- ][\d.]+)?|public domain|pd|pdm|cc[- ]pdm)/i;
export const isFreeLicense = (l: string) => FREE.test(l.trim());

const strip = (html = '') => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
};

export async function searchWikimedia(query: string, signal?: AbortSignal): Promise<ImageCredit[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '24',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '1200',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal });
  if (!res.ok) throw new Error(`Wikimedia Commons error ${res.status}`);
  const data = await res.json();
  const pages = Object.values<any>(data?.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const out: ImageCredit[] = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info || !/^image\/(jpeg|png|webp)/.test(info.mime)) continue;
    const md = info.extmetadata ?? {};
    const license = strip(md.LicenseShortName?.value) || '';
    const nonFree = md.NonFree?.value === 'true' || /fair use/i.test(license);
    if (nonFree || !isFreeLicense(license)) continue;
    out.push({
      url: info.thumburl || info.url,
      sourceUrl: info.descriptionurl,
      title: strip(md.ObjectName?.value) || p.title.replace(/^File:/, '').replace(/\.\w+$/, ''),
      author: strip(md.Artist?.value) || 'Unknown author',
      license,
      licenseUrl: md.LicenseUrl?.value,
      provider: 'wikimedia',
    });
  }
  return out;
}

export async function searchOpenverse(query: string, signal?: AbortSignal): Promise<ImageCredit[]> {
  const params = new URLSearchParams({ q: query, page_size: '20', license_type: 'all-cc', mature: 'false' });
  const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, { signal });
  if (!res.ok) throw new Error(`Openverse error ${res.status}`);
  const data = await res.json();
  return (data.results ?? [])
    .map((r: any): ImageCredit => {
      const license =
        r.license === 'cc0' ? 'CC0' : r.license === 'pdm' ? 'Public domain' : `CC ${String(r.license).toUpperCase()} ${r.license_version ?? ''}`.trim();
      return {
        url: r.url,
        sourceUrl: r.foreign_landing_url || r.url,
        title: r.title || 'Untitled',
        author: r.creator || 'Unknown author',
        license,
        licenseUrl: r.license_url,
        provider: 'openverse',
      };
    })
    .filter((c: ImageCredit) => isFreeLicense(c.license) && !/\bNC\b|\bND\b/i.test(c.license));
}
