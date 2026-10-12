import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { ImagePlus, LoaderCircle, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translate, type Language } from './localization';

export type CastingPhoto = { id: string; file: File; preview: string; originalSize: number };
export function PhotoUpload({ photos, onChange, disabled, language }: { language: Language; photos: CastingPhoto[]; onChange: (photos: CastingPhoto[]) => void; disabled: boolean }) {
  const t = (key: string) => translate(language, key);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function addFiles(files: File[]) {
    setError('');
    if (photos.length + files.length > 3) { setError('تنجم تحمّل 3 صور كحد أقصى'); return; }
    if (files.some(f => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024)) { setError('اختار JPG أو PNG أو WebP، حتى 5 MB للصورة'); return; }
    setBusy(true);
    try {
      const additions = await Promise.all(files.map(async file => {
        const compressed = await imageCompression(file, { maxSizeMB: 0.7, maxWidthOrHeight: 1600, useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.85 });
        if (compressed.size > 1048576) throw new Error('image too large');
        return { id: crypto.randomUUID(), file: compressed, preview: URL.createObjectURL(compressed), originalSize: file.size };
      }));
      onChange([...photos, ...additions]);
    } catch { setError('ما نجّمش نقراو الصورة. اختار صورة أخرى.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }
  return <div>
    <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label={t('اختار صورك')} disabled={disabled || busy} onChange={e => void addFiles(Array.from(e.target.files ?? []))} />
    <div className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!disabled && !busy) void addFiles(Array.from(e.dataTransfer.files)); }}>
      <span className="upload-symbol">{busy ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}</span>
      <strong>{t(busy ? 'قاعدين نحضّروا صورك…' : 'خلّي صورتك تحكي عليك')}</strong>
      <p>{t('تصاور حديثة، بإضاءة باهية ومن غير فلاتر.')}</p>
      <Button type="button" variant="outline" disabled={disabled || busy || photos.length >= 3} onClick={() => input.current?.click()}><Upload />{t('اختار صورك من الهاتف أو الكمبيوتر')}</Button>
      <span className="upload-meta" dir="ltr">JPG, PNG, WebP · {t('حد أقصى 5 MB للصورة · 2–3 صور')}</span>
    </div>
    {photos.length > 0 && <div className="photo-previews">{photos.map((photo, i) => <div className="photo-preview" key={photo.id}>
      <img src={photo.preview} alt={`${t('صورة الترشّح')} ${i + 1}`} />
      <Button type="button" variant="secondary" size="icon" title={t('حذف الصورة')} aria-label={`${t('حذف الصورة')} ${i + 1}`} disabled={disabled} onClick={() => { URL.revokeObjectURL(photo.preview); onChange(photos.filter(p => p.id !== photo.id)); }}><X /></Button>
      <span><Check /> {Math.round(photo.file.size / 1024)} KB</span>
    </div>)}</div>}
    {error && <p className="field-error" role="alert">{t(error)}</p>}
  </div>;
}