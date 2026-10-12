import { createServerFn } from '@tanstack/react-start';
import { submissionSchema } from './schema';

// Public, write-only intake. No application data or storage URLs are returned.
export const submitApplication = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => submissionSchema.parse(input))
  .handler(async ({ data }) => {
    const decoded = data.photos.map(photo => {
      const binary = atob(photo.base64);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      if (bytes.length > 1048576 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw new Error('الصور غير صالحة. جرّب صور أخرى.');
      return bytes;
    });
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const id = crypto.randomUUID();
    const paths: string[] = [];
    try {
      for (const [index, bytes] of decoded.entries()) {
        const path = `${id}/${index + 1}.jpg`;
        const { error } = await supabaseAdmin.storage.from('casting-photos').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
        if (error) throw new Error('ما نجّمش نحمّلوا الصور توّا. عاود جرّب.');
        paths.push(path);
      }
      const { photos: _photos, ...application } = data;
      const { error } = await supabaseAdmin.from('casting_applications').insert({ ...application, id, photo_paths: paths });
      if (error) throw new Error('ما نجّمش نحفظوا الترشّح توّا. عاود جرّب.');
      return { reference: id.slice(0, 8).toUpperCase() };
    } catch (error) {
      if (paths.length) await supabaseAdmin.storage.from('casting-photos').remove(paths);
      throw error;
    }
  });