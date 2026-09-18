# Plano de Implementação

## Descoberta Concluída

- O espaço de trabalho fornecido não continha uma aplicação ou stack existente; apenas instruções de projeto e materiais de referência sincronizados estavam presentes.
- A referência fornecida estabelece uma interface premium para SaaS médico: barra lateral escura à esquerda, área de trabalho clara, cards operacionais densos, ações em tons de azul comedidos e status semânticos para agendamentos.
- A arquitetura definida é um monólito modular com PostgreSQL, multi-tenancy no lado do servidor e TypeScript em modo estrito (strict mode).

## Fase 1 — Fundação (entrega atual)

- [x] Scaffold do projeto com Next.js + React + TypeScript strict + Tailwind.
- [x] Migração de esquema PostgreSQL e definição de seed fictício e realista.
- [x] Autenticação com cookies assinados, validação com Zod, contexto de organização e perfis de acesso (roles).
- [x] Limite de repositório com escopo de tenant e testes de proteção contra acesso entre organizações (cross-tenant).
- [x] Layout principal responsivo, tokens de design e dashboard calculado a partir dos dados do repositório de demonstração.
- [x] Substituir o adaptador de demonstração pelo runtime PostgreSQL local ou gerenciado (requer uma `DATABASE_URL`).

## Fase 2 — Cadastros e Prontuários (concluída)

- [x] Busca, criação, edição e ativação/inativação de pacientes.
- [x] Catálogos de profissionais, especialidades, serviços e salas com criação e validações no servidor com escopo de tenant.
- [x] Estados responsivos para listas vazias, sucesso e validações/erros.
- [x] Completar os controles de edição/ativação/inativação para os catálogos operacionais.
- [x] Persistir as gravações da Fase 2 através do adaptador PostgreSQL configurado.


## Fase 3 — Agendamento (em andamento)

- [x] Agenda diária com criação, confirmação e cancelamento com escopo de tenant.
- [x] Detecção de conflito de horários na camada de serviço tanto para o profissional quanto para a sala.
- [x] Reagendamento de consultas com validação de colisão de profissional e sala.
- [ ] Disponibilidade recorrente, bloqueios de agenda, visualizações por semana/mês e restrições de exclusão no banco de dados.

## Fase 4 — Financeiro (concluída)

- [x] Resumo de fluxo de caixa: total recebido, pendente, despesas operacionais e saldo líquido.
- [x] Listagem, detalhamento e confirmação/baixa de recebimentos de consultas na recepção.
- [x] Cadastro e acompanhamento de despesas operacionais da clínica por categoria e vencimento.
- [x] Rota protegida `/finance` com layout dedicado e link integrado na barra de navegação.
- [x] Testes automatizados com Vitest cobrindo cálculos, regras de tenant e autorização por papéis.


## Fase 5 — Mensagens

Caixa de entrada de conversas, mensagens, modelos (templates) e um provedor mock isolado do WhatsApp.

## Fase 6 — Inteligência Artificial

Agente estritamente administrativo, camada de ferramentas tipadas (typed tools), sem acesso direto ao banco de dados, diretrizes de segurança médica e transição para atendimento humano (human handoff).

## Fase 7 — Automações

Confirmações e lembretes agendados, histórico de execuções, idempotência e tentativas com limite (bounded retries).

## Fase 8 — Relatórios e Inteligência de Dados (concluída)

- [x] Modelagem probabilística de No-Show com classificação de risco e estimativa de impacto financeiro.
- [x] Motor de recomendações prescritivas da IA para intervenção ativa via WhatsApp e listas de espera.
- [x] Mapa de calor 2D de ocupação semanal (horários de pico e janelas de ociosidade operacional).
- [x] Projeção de faturamento (+30 dias) via regressão linear univariada com bandas de confiança estatística de 95%.
- [x] Curva de Pareto (análise ABC 80/20) de serviços e procedimentos da clínica.
- [x] Distribuição demográfica (pirâmide etária) e market share de convênios vs particular.
- [x] Exportação para arquivo CSV e suporte completo à impressão executiva limpa / PDF.
- [x] Rota protegida `/reports`, layout dedicado, link na barra lateral e suíte de testes unitários com Vitest.

## Fases 9–10 — Qualidade e Acabamento

Testes completos de segurança e isolamento de ponta a ponta, verificações de acessibilidade e responsividade, observabilidade, tratamento de erros e prontidão para lançamento.
