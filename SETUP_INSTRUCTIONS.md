# Instruções para replicar projeto

## 1. Copiar projeto base
```powershell
Copy-Item -Path "site\*" -Destination "NOVO_PROJETO\" -Recurse -Force
Copy-Item -Path "site\.gitignore" -Destination "NOVO_PROJETO\.gitignore" -Force
Remove-Item -Path "NOVO_PROJETO\.git" -Recurse -Force
# Remover ficheiros git avulsos: HEAD, config, description, FETCH_HEAD, ORIG_HEAD, COMMIT_EDITMSG, index, hooks, info, logs, objects, refs, opencode
```

## 2. Firebase - Novo projeto
- Criar projeto no Firebase Console
- Ativar **Realtime Database** (modo bloqueado, depois atualizar rules)
- Ativar **Authentication** > **Sign-in method** > **Email/Password**
- Criar users: `admin@NOVODOMINIO.app` e `membros@NOVODOMINIO.app`

## 3. Atualizar código

### firebaseConfig
- `js/firebase-config.js`

Substituir API keys pelo novo projeto Firebase neste arquivo compartilhado.

### Base de dados
- Substituir todas as ocorrências de `sinaloa-data` pelo novo nome se desejado
- Substituir `rocam-data` nos ficheiros copiados

### localStorage keys
Substituir `sinaloa_*` pelo prefixo do novo projeto em:
- `js/config.js`
- `gallery.html`
- `acoes.html`

### Autenticação
- `js/admin.js`: substituir `@sinaloa.app` pelo novo domínio
- `database.rules.json`: atualizar regra de email

### Branding
- Substituir `sinaloa` por novo nome nos HTMLs, metas, títulos, footer
- Trocar logo URLs
- Atualizar texto "Sobre"

### Splash screen
- `index.html` e `js/app.js`: atualizar chave `sinaloaSplashShown`

## 4. git
```powershell
git init
git remote add origin URL_DO_REPO
git branch -M main
git add -A
git commit -m "Initial commit"
git push -u origin main
```



## 6. Atualizar domínio
- Atualizar `og:url` no `index.html` para o URL da Cloudflare
