# Configuração do Supabase Storage para Fotos de Clientes

Para que o upload de fotos funcione, você precisa criar um bucket no Supabase Storage.

## Passos:

1. Acesse o painel do Supabase: https://supabase.com/dashboard

2. Vá em **Storage** no menu lateral

3. Clique em **New bucket**

4. Configure o bucket:
   - **Name**: `fotos-clientes`
   - **Public bucket**: ✅ Marque como público (para permitir acesso às imagens)
   - Clique em **Create bucket**

5. Configure as políticas RLS (Row Level Security):
   - Clique no bucket `fotos-clientes`
   - Vá na aba **Policies**
   - Crie uma política para permitir upload:
     - **Policy name**: `Allow authenticated uploads`
     - **Allowed operation**: `INSERT`
     - **Policy definition**: 
       ```sql
       (bucket_id = 'fotos-clientes'::text) AND (auth.role() = 'authenticated'::text)
       ```
   - Crie uma política para permitir leitura pública:
     - **Policy name**: `Allow public read`
     - **Allowed operation**: `SELECT`
     - **Policy definition**:
       ```sql
       bucket_id = 'fotos-clientes'::text
       ```
   - Crie uma política para permitir atualização:
     - **Policy name**: `Allow authenticated update`
     - **Allowed operation**: `UPDATE`
     - **Policy definition**:
       ```sql
       (bucket_id = 'fotos-clientes'::text) AND (auth.role() = 'authenticated'::text)
       ```

6. Execute o SQL para adicionar o campo `foto_url` na tabela clientes (se ainda não foi executado):
   ```sql
   ALTER TABLE clientes ADD COLUMN IF NOT EXISTS foto_url TEXT;
   ```

Pronto! O upload de fotos agora deve funcionar.
