import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type Bucket = 'receipts' | 'product_images';

// I bucket non sono piu' pubblici: scontrini e foto si leggono solo con un URL
// firmato, valido un'ora. In image_url puo' esserci anche un URL esterno
// (OpenFoodFacts) o una vecchia riga con URL pubblico: quelli si usano come sono.
const cache = new Map<string, string>();

export function useStorageUrl(value: string | null | undefined, bucket: Bucket): string | null {
  const [url, setUrl] = useState<string | null>(
    value && value.startsWith('http') ? value : null
  );

  useEffect(() => {
    let alive = true;

    if (!value) {
      setUrl(null);
      return;
    }
    if (value.startsWith('http')) {
      setUrl(value);
      return;
    }

    const key = `${bucket}/${value}`;
    const hit = cache.get(key);
    if (hit) {
      setUrl(hit);
      return;
    }

    supabase.storage
      .from(bucket)
      .createSignedUrl(value, 3600)
      .then(({ data }) => {
        if (!alive || !data?.signedUrl) return;
        cache.set(key, data.signedUrl);
        setUrl(data.signedUrl);
      });

    return () => {
      alive = false;
    };
  }, [value, bucket]);

  return url;
}

export function StorageImage({
  value,
  bucket,
  alt,
  style,
  openOnClick,
}: {
  value: string | null | undefined;
  bucket: Bucket;
  alt: string;
  style?: CSSProperties;
  openOnClick?: boolean;
}) {
  const url = useStorageUrl(value, bucket);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      style={style}
      onClick={openOnClick ? () => window.open(url, '_blank') : undefined}
    />
  );
}

export function StorageLink({
  value,
  bucket,
  style,
  children,
}: {
  value: string | null | undefined;
  bucket: Bucket;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const url = useStorageUrl(value, bucket);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={style}>
      {children}
    </a>
  );
}
