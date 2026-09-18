# 🩺 CliniAI — Aplicação Web

Este subdiretório contém o código-fonte da aplicação web Next.js do **CliniAI**.

Para a documentação completa de arquitetura, funcionalidades, modelos de dados, segurança multi-tenant e instruções de execução, consulte o [README principal do repositório](../README.md).

## Execução Rápida

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts Disponíveis

* `npm run dev` — Inicia o servidor de desenvolvimento com Next.js Turbopack.
* `npm run build` — Compila a aplicação para produção.
* `npm start` — Inicia o servidor de produção compilado.
* `npm test` — Executa a suíte de testes unitários com Vitest.
* `npm run db:migrate` — Executa as migrações SQL no banco PostgreSQL.
* `npm run db:seed` — Executa o seed idempotente de dados iniciais.
