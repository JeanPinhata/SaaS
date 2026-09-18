<div align="center">

# 🩺 CliniAI — Inteligência Médica & Gestão Clínica SaaS

**Plataforma de alta performance para gestão de clínicas, consultórios médicos e inteligência preditiva.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.6-336791?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2.4-729B1B?style=for-the-badge&logo=vitest)](https://vitest.dev/)

[Visão Geral](#-visão-geral) •
[Funcionalidades](#-funcionalidades) •
[Arquitetura](#-arquitetura--segurança) •
[Como Executar](#-como-executar-localmente) •
[Deploy](#-deploy-na-vercel) •
[Licença](#-licença)

---

</div>

## 🌟 Visão Geral

O **CliniAI** é um software como serviço (SaaS) completo, moderno e seguro, desenvolvido especificamente para clínicas médicas e consultórios que necessitam de agilidade operacional, eliminação de faltas (no-show) e previsão financeira inteligente.

Construído sob uma arquitetura **Multi-Tenant estrita com isolamento de dados em nível de linha (RLS/Tenant Boundary)**, permite que múltiplos consultórios utilizem a mesma infraestrutura em nuvem mantendo prontuários, agendas e finanças com privacidade e conformidade absoluta.

---

## 🚀 Funcionalidades Principais

### 1. 🏢 Multi-Tenancy & Onboarding Dinâmico ([`/register`](http://localhost:3000/register) e [`/login`](http://localhost:3000/login))
- Criação instantânea de novas clínicas (tenants) através do fluxo de cadastro integrado.
- Sessão segura criptografada com JWT (HMAC-SHA256) e cookies `HttpOnly`.
- Controle de permissões baseado em papéis (**RBAC**): `OWNER`, `ADMIN`, `MANAGER`, `DOCTOR`, `SECRETARY`.
- Resolução dinâmica do nome da clínica, administrador e avatar personalizado na interface.

### 2. 👥 Pacientes & Prontuários ([`/patients`](http://localhost:3000/patients))
- Busca em tempo real por nome, CPF e telefone.
- Cadastro completo com validação de dados, convênio, data de nascimento e observações clínicas.
- Controle de status (ativo/inativo) e histórico de consultas.

### 3. 📅 Agenda Inteligente Anti-Conflito ([`/agenda`](http://localhost:3000/agenda))
- Visualização diária organizada por faixas de horário.
- **Validação anti-colisão:** Impede agendamentos duplicados tanto para o profissional quanto para a sala de atendimento.
- Reagendamento e cancelamento ágeis com confirmação de status.

### 4. 🏷️ Catálogos Operacionais ([`/catalogs`](http://localhost:3000/catalogs))
- Gestão centralizada de:
  - **Profissionais:** Especialidade, CRM, telefone e e-mail.
  - **Especialidades Médicas:** Ativação/inativação de catálogo.
  - **Serviços & Procedimentos:** Duração padrão em minutos e precificação.
  - **Salas de Atendimento:** Descrição e alocação física.

### 5. 💰 Financeiro & Fluxo de Caixa ([`/finance`](http://localhost:3000/finance))
- Resumo de fluxo de caixa em tempo real:
  - Total Recebido (consultas liquidadas).
  - Total Pendente (atendimentos a faturar).
  - Despesas Operacionais da clínica.
  - Saldo Líquido consolidado.
- Baixa imediata de recebimentos de consultas na recepção (PIX, Cartão de Crédito/Débito, Dinheiro).
- Lançamento e categorização de despesas com datas de vencimento e quitação.

### 6. 🧠 Relatórios & Inteligência de Dados ([`/reports`](http://localhost:3000/reports))
- **Scoring Preditivo de No-Show:** Avaliação probabilística da chance de falta por consulta com fatores determinantes (*feature importance*) e cálculo do impacto financeiro evitado.
- **Recomendações Prescritivas da IA:** Sugestões ativas de réguas de WhatsApp (48h e 12h) e listas de espera inteligentes.
- **Mapa de Calor 2D de Ocupação Semanal:** Densidade térmica de horários de pico (ex.: 10h-11h30 com 94% de ocupação) e janelas de ociosidade operacional (para encaixes e campanhas).
- **Previsão de Faturamento (+30 dias):** Regressão linear univariada sobre séries temporais com bandas sombreadas de intervalo de confiança de 95% (cenário otimista e conservador).
- **Curva de Pareto (80/20):** Identificação dos 20% dos serviços que geram 80% da receita.
- **Demografia:** Pirâmide etária e market share de operadoras de saúde vs atendimentos particulares.
- **Exportação Executiva:** Download de planilha consolidada em `.csv` em 1 clique e suporte completo a impressão limpa/PDF.

---

## 🛠️ Tecnologias e Arquitetura

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Backend / Auth** | Next.js Server Components, Server Actions com Zod, JWT via [jose](https://github.com/panva/jose), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Banco de Dados** | [PostgreSQL 17](https://www.postgresql.org/) hospedado no [Supabase](https://supabase.com/) com Session Pooler (`pg`) |
| **Idempotência & Resiliência** | Migrações SQL versionadas (`database/migrations`), Seeds idempotentes (`ON CONFLICT DO UPDATE`) e Dual-Mode (PostgreSQL + Fallback em memória para testes) |
| **Testes Automatizados** | [Vitest 3.2](https://vitest.dev/) com 20 suítes unitárias cobrindo regras de negócio, autorização e cálculos matemáticos |

---

## 🔒 Segurança e Isolamento de Dados (Multi-Tenancy)

O CliniAI foi concebido sob princípios de **Security by Design**:
- **Carimbo de Tenant (`organization_id`):** Todas as tabelas operacionais possuem chave estrangeira obrigatória referenciando a organização.
- **Derivação Exclusiva por Sessão:** O identificador da clínica nunca é fornecido pelo navegador nas requisições; ele é obrigatoriamente lido e decodificado a partir do token criptografado da sessão.
- **Trava Antifraude (`assertTenantAccess`):** Qualquer tentativa de mutação cruzada entre organizações é rejeitada instantaneamente na camada de serviço com erro `Tenant access denied`.

---

## 💻 Como Executar Localmente

### Pré-requisitos
- Node.js 20+ instalado
- Git

### 1. Clonar o Repositório
```bash
git clone https://github.com/JeanPinhata/SaaS.git
cd SaaS/cliniai
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` dentro da pasta `cliniai/`:
```env
# Conexão com Supabase PostgreSQL (ou Postgres local)
DATABASE_URL="postgresql://postgres.[SEU_PROJETO]:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJETO].supabase.co:5432/postgres"

# Segredo de Sessão (JWT)
AUTH_SECRET="chave-secreta-de-producao-cliniai-trocar-em-prod"
```

### 4. Executar Migrações e Seeds (Opcional)
```bash
npm run db:migrate
npm run db:seed
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Contas de Demonstração Rápidas
- **Clínica de Demonstração (Clínica Vida):**
  - E-mail: `admin@cliniai.demo`
  - Senha: `password123`
- **Criar Nova Clínica Própria:**
  - Acesse [http://localhost:3000/register](http://localhost:3000/register) e crie seu tenant isolado em segundos.

---

## 🧪 Execução de Testes Automatizados

Para rodar a suíte completa de testes unitários:

```bash
npm test
```

Para rodar a checagem de tipos estrita do TypeScript:
```bash
npx tsc --noEmit
```

---

## ☁️ Deploy na Vercel

O projeto está 100% preparado para deploy direto na [Vercel](https://vercel.com/):

1. Conecte o repositório `JeanPinhata/SaaS` na Vercel.
2. Defina o **Root Directory** como:
   ```
   cliniai
   ```
3. Configure as variáveis de ambiente em **Project Settings > Environment Variables**:
   * `DATABASE_URL`: String de conexão do Supabase Pooler.
   * `DIRECT_URL`: String de conexão direta do Supabase.
   * `AUTH_SECRET`: String aleatória de 32+ caracteres para assinatura dos tokens.
4. Clique em **Deploy**.

---

## 📄 Licença

Este projeto é desenvolvido e mantido por seus autores sob uso privado e comercial.
