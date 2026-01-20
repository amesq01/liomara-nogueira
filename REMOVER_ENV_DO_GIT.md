# Como Remover o Arquivo .env do Histórico do Git/GitHub

## ⚠️ IMPORTANTE: O arquivo .env foi commitado e está no histórico do Git

O arquivo `.env` com suas credenciais do Supabase foi commitado no commit `ca35b16` e ainda está no histórico do Git, mesmo que você tenha tentado removê-lo depois.

## 🔐 Por que isso é um problema?

As credenciais do Supabase estão expostas no histórico do Git e no GitHub. Isso é um risco de segurança, pois qualquer pessoa com acesso ao repositório pode ver essas informações.

## ✅ Solução: Remover do Histórico do Git

### Opção 1: Usando git filter-branch (Recomendado para histórico completo)

```bash
# 1. Certifique-se de que está na branch principal (geralmente main ou master)
git checkout main  # ou master

# 2. Remover o arquivo .env de TODO o histórico do Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Forçar a atualização do repositório remoto
git push origin --force --all
git push origin --force --tags
```

### Opção 2: Usando git filter-repo (Mais moderno e eficiente)

Se você tiver o `git-filter-repo` instalado:

```bash
# Instalar git-filter-repo (se não tiver)
# macOS: brew install git-filter-repo
# Linux: pip install git-filter-repo

# Remover o arquivo do histórico
git filter-repo --path .env --invert-paths

# Forçar push
git push origin --force --all
```

### Opção 3: Usando BFG Repo-Cleaner (Mais rápido para repositórios grandes)

```bash
# 1. Baixar BFG Repo-Cleaner de https://rtyley.github.io/bfg-repo-cleaner/

# 2. Criar uma cópia do repositório (clone bare)
cd ..
git clone --mirror https://github.com/amesq01/liomara-nogueira.git liomara-nogueira-clean.git
cd liomara-nogueira-clean.git

# 3. Remover o arquivo .env
java -jar bfg.jar --delete-files .env

# 4. Limpar e fazer push
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push
```

## 🚨 ATENÇÃO: Após remover do histórico

### 1. Rotacionar as credenciais do Supabase

**IMPORTANTE**: Como as credenciais já foram expostas, você DEVE:

1. Acessar o painel do Supabase: https://supabase.com/dashboard
2. Ir em **Settings > API**
3. **Regenerar** a `anon key` (chave anônima)
4. Atualizar o arquivo `.env` local com a nova chave

### 2. Garantir que o .env está no .gitignore

Verifique se o `.gitignore` contém:

```
.env
.env*.local
```

### 3. Notificar colaboradores

Se outras pessoas trabalham neste repositório, elas precisarão:

```bash
# Fazer backup do trabalho atual
git stash

# Deletar a branch local
git checkout main
git branch -D main  # ou master

# Buscar a versão limpa
git fetch origin
git reset --hard origin/main
```

## 📋 Passo a Passo Simplificado (Recomendado)

```bash
# 1. Certifique-se de estar na branch principal
git checkout main

# 2. Remover o arquivo do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Limpar referências
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Forçar push para o GitHub (CUIDADO: isso reescreve o histórico)
git push origin --force --all
git push origin --force --tags

# 5. Rotacionar as credenciais no Supabase (IMPORTANTE!)
# Acesse: https://supabase.com/dashboard > Settings > API > Regenerate anon key
```

## ⚠️ AVISOS IMPORTANTES

1. **Backup**: Faça um backup do repositório antes de executar esses comandos
2. **Colaboradores**: Todos que trabalham no projeto precisarão refazer o clone ou fazer hard reset
3. **Forks**: Se alguém fez fork do repositório, as credenciais ainda estarão lá
4. **Rotacionar credenciais**: SEMPRE rotacione as credenciais após exposição

## 🔍 Verificar se funcionou

```bash
# Verificar se o arquivo ainda está no histórico
git log --all --full-history -- .env

# Se não retornar nada, o arquivo foi removido com sucesso!
```

## 📝 Próximos Passos

1. ✅ Execute os comandos acima para remover do histórico
2. ✅ Rotacione as credenciais no Supabase
3. ✅ Atualize o arquivo `.env` local com as novas credenciais
4. ✅ Certifique-se de que o `.gitignore` está correto
5. ✅ Crie um arquivo `.env.example` com variáveis vazias como exemplo
