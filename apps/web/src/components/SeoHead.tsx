import React from 'react';
import { getSeoMeta, type SeoMeta } from '@/lib/seoConfig';

export interface SeoHeadProps {
  section?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noIndex?: boolean;
}

export default function SeoHead({
  section = 'default',
  title,
  description,
  keywords,
  image,
  url,
  noIndex,
}: SeoHeadProps) {
  const meta: SeoMeta = React.useMemo(
    () =>
      getSeoMeta(section, {
        title,
        description,
        keywords,
        image,
        url,
      }),
    [section, title, description, keywords, image, url],
  );

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = meta.title;

    const ensureMeta = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
        document.head.appendChild(el);
      } else {
        Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
      }
    };

    // Básicos
    ensureMeta('meta[name="description"]', { name: 'description', content: meta.description });
    ensureMeta('meta[name="keywords"]', { name: 'keywords', content: meta.keywords.join(', ') });
    ensureMeta('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex,nofollow' : 'index,follow',
    });

    // Open Graph
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title });
    ensureMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: meta.description,
    });
    ensureMeta('meta[property="og:image"]', { property: 'og:image', content: meta.image });
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: meta.url });
    ensureMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: meta.siteName,
    });

    // Twitter
    ensureMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
    ensureMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: meta.description,
    });
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: meta.image });

    // Favicon / icono
    const ensureLink = (rel: string, href: string) => {
      let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        document.head.appendChild(link);
      } else {
        link.href = href;
      }
    };

    ensureLink('icon', meta.icon);
    ensureLink('apple-touch-icon', meta.icon);
  }, [meta, noIndex]);

  return null;
}

