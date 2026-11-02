# Psicontrol — TCC

Sistema de gestão para psicólogos e profissionais de saúde: pacientes, agenda sincronizada com o Google Agenda, cobranças, receitas/despesas e recibos em PDF.

| Pasta | Conteúdo | Origem |
|---|---|---|
| `backend/` | API em Node.js + Express + PostgreSQL | branch `B19` de `Psicontrol` |
| `frontend/` | Interface em React + Tailwind | branch `responsividade` de `Psicontrol-front` |

O histórico de commits dos dois projetos foi mantido.

## Como rodar

Backend (porta 3000), com o `DATABASE_URL` e as credenciais do Google no `backend/.env`:

```bash
cd backend
npm install
npm run dev
```

Frontend (porta 3001), com `REACT_APP_API_URL=http://localhost:3000` no `frontend/.env`:

```bash
cd frontend
npm install
PORT=3001 npm start
```

Depois é só abrir http://localhost:3001.
