import React from 'react';
import { Helmet } from 'react-helmet-async';
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

  const keywordsContent = meta.keywords.join(', ');

  return (
    <Helmet prioritizeSeoTags>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={keywordsContent} />
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:site_name" content={meta.siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.image} />
      <link rel="icon" href={meta.icon} />
      <link rel="apple-touch-icon" href={meta.icon} />
    </Helmet>
  );
}

