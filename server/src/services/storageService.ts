import { SupabaseClient } from '@supabase/supabase-js';

export class StorageService {
  private bucketName = 'attachments';

  // WYSYŁANIE PLIKU DO BAZY
  async uploadFile(supabase: SupabaseClient, path: string, fileBuffer: Buffer, contentType: string) {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;
    
    // POBIERANIE PUBLICZNEGO ADRESU URL
    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return { path: data.path, url: publicUrl };
  }
}
