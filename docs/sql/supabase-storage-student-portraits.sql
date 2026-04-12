-- Nexus — Storage: bucket privado para fotos de aluno (Opção 1: upload via Nest + service_role).
-- Rode no Supabase: SQL Editor → colar → Run.
-- Docs: https://supabase.com/docs/guides/storage/security/access-control

-- Bucket privado (sem leitura pública). Limite 20 MB; só JPEG/PNG/WebP.
-- (Foto “crua” de câmera boa passa fácil de 5 MB; em produção o ideal é ainda
-- redimensionar/comprimir no Next ou no Nest antes de gravar — menos custo e
-- página mais leve. O teto aqui só evita upload acidental gigante.)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-portraits',
  'student-portraits',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Sem políticas adicionais em storage.objects para "anon" / "authenticated":
-- o Supabase nega acesso por padrão a buckets privados para esses papéis.
--
-- O Nest, usando o client com SUPABASE_SERVICE_ROLE_KEY, faz upload/delete/list
-- pelo SDK (não depende de política pública). O Next nunca fala direto com o
-- Storage na Opção 1 — só com a tua API.
--
-- Se no futuro você quiser upload direto do browser com JWT do Supabase Auth,
-- aí sim crie políticas com auth.uid() e pasta por usuário (outro passo).
