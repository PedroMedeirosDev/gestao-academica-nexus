import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StudentPortraitStorageService {
  private readonly logger = new Logger(StudentPortraitStorageService.name);
  private cached: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    const url = this.config.get<string>('SUPABASE_URL')?.trim();
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    return Boolean(url && key);
  }

  /** Bucket já criado no painel (padrão `student-portraits`). */
  getBucket(): string {
    return (
      this.config.get<string>('SUPABASE_STORAGE_BUCKET')?.trim() ||
      'student-portraits'
    );
  }

  private client(): SupabaseClient {
    if (this.cached) {
      return this.cached;
    }
    const url = this.config.get<string>('SUPABASE_URL')?.trim();
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    if (!url || !key) {
      throw new Error('Supabase não configurado');
    }
    this.cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.cached;
  }

  async uploadObject(
    objectKey: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    const { error } = await this.client().storage
      .from(this.getBucket())
      .upload(objectKey, buffer, {
        contentType,
        upsert: false,
      });
    if (error) {
      this.logger.warn(`Falha no upload ao storage: ${error.message}`);
      throw error;
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    const { error } = await this.client().storage
      .from(this.getBucket())
      .remove([objectKey]);
    if (error) {
      this.logger.warn(`Falha ao apagar objeto no storage: ${error.message}`);
    }
  }

  async createSignedReadUrl(
    objectKey: string,
    expiresSeconds: number,
  ): Promise<string> {
    const { data, error } = await this.client().storage
      .from(this.getBucket())
      .createSignedUrl(objectKey, expiresSeconds);
    if (error || !data?.signedUrl) {
      this.logger.warn(
        `Falha ao gerar URL assinada: ${error?.message ?? 'sem URL'}`,
      );
      throw error ?? new Error('URL assinada vazia');
    }
    return data.signedUrl;
  }
}
