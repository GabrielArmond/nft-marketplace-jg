# Arquitetura e decisões

## Visão geral

A UI é React + TypeScript, construída com Vite, estilizada com Tailwind CSS e componentes próprios em `src/components/ui` que usam primitives do `radix-ui`. A configuração `components.json` segue a convenção shadcn/ui. O roteamento é TanStack Router, dados remotos/cache são TanStack Query, REST passa pelo Axios e as respostas são validadas pelos schemas Zod em `src/contracts`.

Os módulos de `src/features` mantêm as páginas e operações próximas do domínio. As rotas críticas de home e detalhe têm módulos `.lazy.tsx`; os loaders leves iniciam a consulta e a página é importada sob demanda. A árvore de rotas é gerada pelo plugin TanStack Router e não deve ser editada manualmente.

O modo demo usa MSW no navegador para interceptar REST e WebSocket. Não existe backend remoto nem integração financeira real no fluxo demonstrado. A aplicação não envia transações à blockchain.

## Fronteiras e fluxo de dados

```text
Página/feature → TanStack Query → API da feature → Axios → REST
                                              ↘ Zod contracts
MSW intercepta REST no transporte ────────────┘

MSW Socket.IO binding ⇄ socket.io-client → sincronizadores → cache Query
```

- A UI não fabrica respostas de negócio. Fixtures e regras ficam em `src/mocks`.
- Clientes REST e handlers mock usam os mesmos contratos tipados.
- Preços e quantidades ETH trafegam como strings decimais. `src/lib/money/eth.ts` usa inteiros de alta precisão para operações, sem conversões intermediárias para `number`.
- Quantidades são inteiros positivos; rede, status e categoria são enums validados.
- Erros não 2xx usam `{ "error": { "code", "message", "fieldErrors?" } }`, definido por `apiErrorEnvelopeSchema`. O cliente converte o transporte para `ApiError`.

## Contratos REST

Prefixo configurável por `VITE_API_BASE_URL` (padrão `/api`). `src/features/*/api.ts` é o índice das chamadas do cliente; os handlers correspondentes em `src/mocks/handlers/` definem a simulação.

| Método e caminho | Operação | Acesso |
| --- | --- | --- |
| `POST /auth/register` | Cria usuário e inicia sessão | Público |
| `POST /auth/login` | Autentica e inicia sessão | Público |
| `GET /auth/session` | Retorna sessão atual ou visitante | Público |
| `POST /auth/logout` | Encerra sessão | Sessão |
| `GET /nfts` | Busca, filtros, aba, ordenação e paginação; retorna itens, página e facets | Público |
| `GET /nfts/:id` | Detalhe e edições; 404 para NFT inexistente | Público |
| `GET /favorites` | Lista favoritos do usuário | Sessão |
| `PUT /favorites/:nftId` | Adiciona favorito | Sessão |
| `DELETE /favorites/:nftId` | Remove favorito | Sessão |
| `GET /cart` | Lê carrinho do visitante ou usuário | Público |
| `POST /cart/items` | Adiciona edição/quantidade | Público |
| `PATCH /cart/items/:itemId` | Atualiza quantidade | Público |
| `DELETE /cart/items/:itemId` | Remove item | Público |
| `PUT /cart/coupon`, `DELETE /cart/coupon` | Aplica/remove cupom | Público |
| `POST /quotes` | Revalida preço, disponibilidade, cupom, rede, taxas e total | Sessão |
| `POST /orders` | Cria/recupera tentativa; exige `Idempotency-Key` | Sessão |
| `GET /orders`, `GET /orders/:id` | Lista pedidos próprios e consulta recibo/status | Sessão |
| `GET /profile`, `PATCH /profile` | Consulta e atualiza perfil | Sessão |
| `PUT /profile/avatar`, `DELETE /profile/avatar` | Atualiza/remove avatar | Sessão |
| `PUT /profile/password` | Altera senha após validar senha atual | Sessão |
| `GET /wallets`, `POST /wallets` | Consulta/cadastra carteiras | Sessão |
| `PATCH /wallets/:id` | Atualiza carteira | Sessão |
| `POST /wallets/:id/primary` | Torna carteira principal | Sessão |
| `POST /wallets/:id/connect`, `POST /wallets/:id/disconnect` | Simula conexão da carteira | Sessão |

O formato completo de request/response é o schema exportado em `src/contracts/{auth,nfts,cart,orders,account,common}.ts`. O checkout cria quote em endpoint próprio e o pedido não reutiliza uma cotação vencida sem nova revisão. Repetir a chave de idempotência com o mesmo payload recupera a operação; chave obrigatória ausente ou conteúdo diferente produz erro de contrato.

Os erros tipados cobrem validação, credenciais, sessão inválida/expirada, permissão, ausência de recurso, conflito de estoque, cotação obsoleta, carrinho vazio, cupom, idempotência, carteira, rate limit e falha transitória. O código exato está em `API_ERROR_CODES`.

## Sessão, usuários e privacidade

- A sessão é consultada por `GET /auth/session`, mantida por cookie de sessão na demonstração e tem expiração simulada de uma hora. O cliente não persiste a senha.
- O mock é executado no mesmo contexto da página; por isso seu cookie não reproduz as garantias de `HttpOnly` que o backend de produção deve fornecer. Não use a camada de mocks como autenticação de produção.
- Sessão expirada limpa a identidade/cache privado e permite retomada do fluxo. Rascunhos de perfil e checkout são guardados em `sessionStorage`; campos de senha não são armazenados.
- Logout explícito apaga rascunhos/tentativas de checkout, desconecta e reinicia o cliente realtime associado à identidade, e limpa dados privados do QueryClient. A troca de usuário também reinicia os dados sob as chaves privadas.
- Os fixtures têm Anna e Gabriel, com favoritos, perfil e carteiras próprios. As rotas privadas recusam visitante e não revelam recursos de outra conta.

As credenciais estão em [README.md](./README.md). São contas exclusivamente fictícias.

## Carrinho e compra

O carrinho tem identidade de visitante (cookie `kurio_guest`) ou identidade do usuário. A simulação persiste o banco em `localStorage`, incluindo carrinho, favoritos, catálogo, quote, pedido e estado de runtime; o listener `storage` sincroniza abas. O login preserva os itens do visitante na migração para a conta. A resposta da API é a fonte para os totais e valores apresentados.

Alterações de item aplicam a resposta completa do servidor ao cache; em falha, o cache é revalidado porque estoque e preço podem ter mudado. Favoritar usa atualização otimista por NFT, cancela leitura concorrente, desfaz somente o item atingido em erro e invalida a lista após mutation.

Antes de enviar, checkout cria/renova a cotação e pede aceite se valores/estoque/condições mudaram. A chave idempotente e o payload do pedido ficam juntos em `sessionStorage` por usuário antes do POST. Se houver timeout/resposta perdida, a próxima tentativa repete exatamente chave e conteúdo; não cria uma segunda compra. A UI só apresenta confirmação após status confirmado. Pedido pendente é acompanhado por evento e consulta REST; estados confirmado/recusado são terminais. O recibo usa o snapshot imutável do pedido. Em confirmação, só as quantidades compradas são removidas do carrinho; em recusa, os itens são mantidos.

## TanStack Query: cache, retries e sincronização

Configuração base em `src/app/query-client.ts`:

- `staleTime`: 30 s; `gcTime`: 5 min. A sessão tem 10 min de stale time.
- Queries tentam novamente no máximo duas vezes somente para erros transitórios, com atraso exponencial limitado a 8 s. Erros de validação, autenticação, permissão, conflito e 404 não são repetidos.
- Mutations não são repetidas automaticamente. Repetições de criação de pedido usam a chave idempotente persistida.
- Refetch em foco/reconexão usa os defaults do TanStack Query para queries stale.
- Quote tem `staleTime: Infinity` por chave de rede e assinatura do carrinho, pois nova quote exige ação/revalidação explícita; `gcTime: 0` evita manter quotes antigas. Pedido pendente consulta REST a cada 5 s como fallback; status terminal não refaz polling.
- Chaves de dados privados começam com `private`. O catálogo diferencia params de cada query. Mudanças de sessão limpam a partição privada; o usuário atual não lê cache pertencente ao anterior.
- NFT event atualiza detalhes, listas, favoritos e invalida carrinho quando necessário. Mudanças de preço que alterem ordenação/facets invalidam listas para refetch. Order event atualiza status e invalida pedidos, carrinho e catálogo ao finalizar.

## Socket.IO e consistência

O cliente é `socket.io-client`, carregado sob demanda e tipado para eventos somente de servidor. A simulação usa `@mswjs/socket.io-binding` em MSW, com WebSocket/Engine.IO; polling HTTP não está implementado no mock, então o cliente configura `transports: ['websocket']`. Esse transporte e esse servidor são específicos da demo, não substituem um servidor Socket.IO de produção.

| Evento | Identidade e dados | Efeito |
| --- | --- | --- |
| `nft.updated` | `id`, `occurredAt`, `version`, `resource: { type: 'nft', id }`; preço, preço anterior, disponibilidade e edições | Atualiza caches de catálogo, detalhe e favoritos; invalida carrinho/listas afetadas. |
| `order.updated` | `id`, `occurredAt`, `version`, `resource: { type: 'order', id }`; status e motivo de recusa | Atualiza pedido e, ao terminar, invalida pedido(s), carrinho e catálogo. |

Payloads são parseados por Zod antes de chegar aos listeners. `createEventGate` descarta IDs repetidos e versões não crescentes. Handshake liga conexão à sessão atual; login/logout/troca de usuário reinicia a conexão para não cruzar identidades. Ao reconectar, sincronizadores invalidam recursos ativos pela API REST, já que o mock não faz replay automático de todas as mensagens perdidas. Listeners são removidos no cleanup de seus ciclos de vida. A escrita de dados sempre passa por REST; socket não é usado como atalho de mutation.

## MSW e controle dos cenários

`VITE_ENABLE_MOCKS=true` importa `src/mocks/browser.ts`, registra handlers REST e WebSocket e só então monta a UI. Os handlers reutilizam schemas dos contratos. A base inicial é determinística (`DEFAULT_SEED=1`), inclui NFTs fixos do layout e NFTs gerados para filtros/paginação. Reset elimina dados alterados e retorna a fixtures conhecidas.

As regras de falha têm método/caminho, fase antes/depois do commit, quantidade de usos e uma ação HTTP, de rede, hang ou mutação de estado. A latência pode ser fixa, range reproduzível por seed ou resposta fora de ordem. `payment-pending` aguarda liquidação via controle. `duplicate-events` e `stale-events` validam deduplicação/ordenação pelo socket real do cliente.

Endpoints de controle no mesmo origin (prefixo `/__mock__`):

| Endpoint | Uso |
| --- | --- |
| `GET /state` | Lê cenário, relógio, pedidos, sessões, eventos e conexões. |
| `POST /reset` | Reseta base, sessão, eventos e sockets; aceita cenário e seed. |
| `POST /scenario` | Muda cenário, seed e/ou latência. |
| `POST /clock` | Avança relógio simulado ou define instante. |
| `POST /faults`, `DELETE /faults` | Adiciona/remove regras de falha dinâmicas. |
| `PATCH /nfts/:id` | Atualiza preço/estoque de uma edição e emite evento. |
| `POST /orders/:id/settle` | Liquida pedido pendente como confirmado ou recusado. |
| `POST /session/expire` | Expira a sessão atual. |
| `POST /socket` | Desconecta, derruba ou reabre o transporte simulado. |
| `POST /socket/replay` | Reenvia evento do histórico para exercitar duplicatas/versões antigas. |

Esses controles são facilitadores de testes/demonstração e devem permanecer restritos ou desabilitados em backend de produção.

## Interface, responsividade e acessibilidade

As imagens NFT WebP locais têm variantes de 320 px para cards e 640 px para hero/detalhe; `alt` vem dos dados do NFT. Roboto Mono é carregada do pacote local Fontsource, sem depender de CDN. A home prioriza a primeira imagem de card e deixa outras lazy; skeletons de catálogo/detalhe/carrinho preservam espaço e respeitam `prefers-reduced-motion` no componente de skeleton.

Rotas e componentes usam labels e semântica HTML, erros ligados aos campos e mensagens acessíveis. Diálogos/drawers usam primitives Radix para comportamento de foco e teclado; há skip link e testes de navegação por teclado. Layout responsivo é implementado em Tailwind. Os snapshots versionados cobrem início, detalhe, carrinho, pagamento, perfil e carteiras em 390×844, 768×1024 e 1440×900. Os projetos Playwright rodam os fluxos E2E nos três tamanhos.


## Verificação e limites conhecidos

- E2E/regressão visual: `e2e/*.spec.ts`, dois projetos Chromium, trace retido em falhas e snapshots em `e2e/__screenshots__/`.
- Lighthouse: mediana de três runs por página/perfil, relatório atual em `reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/`. Performance mobile foi 80 em home e detalhe, abaixo da meta 90; LCP/TBT e causas estão no relatório. Desktop foi 99. Não foi removida funcionalidade, imagem ou fonte para a auditoria.
- A aplicação está publicada em [nft-marketplace-jg-cyan.vercel.app](https://nft-marketplace-jg-cyan.vercel.app/). O build Vercel usa o modo demo e fallback SPA configurados em `vercel.json`; a instância pública depende dos mocks, não de um backend de produção.
- Sem backend externo, cookies seguros reais, transação blockchain, carteira extension ou gateway, a simulação não deve ser tratada como ambiente de segurança/produção.
