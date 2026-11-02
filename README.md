# Kurio — NFT Marketplace

Marketplace responsivo de NFTs desenvolvido para o desafio Frontend. A aplicação cobre descoberta e detalhe de NFTs, favoritos, carrinho, checkout, pedidos e área da conta. API, autenticação, carteiras, pagamento e tempo real são simulados no navegador; não há integração com blockchain, extensões de carteira, gateway ou backend de produção.

## Requisitos

- Node.js 24 ou superior (definido em `package.json`).
- npm e um navegador Chromium para os testes Playwright.

## Instalação e execução

```bash
npm ci
npm run dev:mocks
```

Abra `http://localhost:8080`. O modo `demo` carrega `.env.demo`, habilita MSW e serve a API simulada. Para a aplicação sem mocks, configure um serviço compatível com a API e execute `npm run dev`.

### Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Prefixo REST usado pelo Axios. |
| `VITE_API_TIMEOUT_MS` | `10000` | Timeout das chamadas HTTP. Deve ser um inteiro positivo. |
| `VITE_SOCKET_URL` | mesma origem | Origem Socket.IO; vazio usa a origem atual. |
| `VITE_ENABLE_MOCKS` | `false` | Inclui e ativa o service worker MSW quando `true`. `.env.demo` ativa os mocks. |

Não há segredos necessários para rodar a demonstração. `.env.example` documenta os valores de desenvolvimento; `.env.demo` é intencionalmente versionado.

## Contas fictícias

| E-mail | Senha | Nome |
| --- | --- | --- |
| `anna@kurio.test` | `Kurio@2026` | Anna Almeida |
| `gabriel@kurio.test` | `Mint#2026` | Gabriel Guerra |

Os fixtures armazenam salt e hash das senhas, não as senhas em claro. Esses dados servem somente à simulação local.

## Cenários de mock

Os mocks ficam na camada de rede (`src/mocks`) e usam os mesmos schemas de `src/contracts` que validam as respostas da aplicação. O estado simulado persiste em `localStorage` para permitir refresh, é sincronizado entre abas e pode ser restaurado integralmente.

Os parâmetros iniciais de mock são aplicados uma vez e removidos da URL:

```text
/?mock_reset=1&mock_scenario=default&mock_seed=1
/?mock_reset=1&mock_scenario=slow&mock_latency=3000
/?mock_reset=1&mock_scenario=payment-refused
```

Parâmetros disponíveis: `mock_reset`, `mock_scenario`, `mock_seed`, `mock_latency` e `mock_clock`. Os cenários existentes incluem:

- `default`, `instant`, `empty-catalog`, `slow`, `variable-latency`, `out-of-order`;
- `offline`, `flaky-connection`, `timeout`, `http-400`, `http-403`, `http-404`, `http-429`, `http-500`, `http-503`;
- `session-expired`, `session-expires-on-checkout`, `unauthorized-access`, `register-conflict`, `profile-validation-error`;
- `price-changed-on-checkout`, `edition-sold-out-on-checkout`, `order-timeout-after-create`, `order-response-lost`;
- `payment-refused`, `payment-pending`, `wallet-refused`, `socket-down`, `duplicate-events`, `stale-events`.

Para mudar o cenário sem recarregar, use `POST /__mock__/scenario` com `{"id":"payment-pending"}`. A API de controle também permite reset, avanço do relógio, criação/limpeza de falhas, atualização de edição, liquidação de pedido, expiração de sessão e controle/replay do socket. Os endpoints estão descritos em [ARCHITECTURE.md](./ARCHITECTURE.md). Eles são ferramentas da demonstração/testes, não uma API administrativa de produção.

Cupons seeded: `KURIO10` é válido e `LANCAMENTO` está expirado. Reset padrão: `POST /__mock__/reset` com `{"scenario":"default","seed":1}`, ou carregue uma rota com `?mock_reset=1&mock_scenario=default`.

## Comandos

```bash
npm run dev:mocks          # Vite em modo demo, com MSW
npm run build              # TypeScript e build sem o modo demo
npm run build:demo         # TypeScript e build otimizado com mocks
npm run preview            # Preview local da build
npm run typecheck          # Verificação de tipos
npm run lint               # ESLint
npm run test:e2e:install   # Instala Chromium para Playwright
npm run test:e2e           # E2E e regressão visual em desktop e mobile
npm run test:e2e:report    # Abre o relatório HTML do Playwright
```

O Playwright constrói `build:demo` e inicia o preview em `localhost:4173` (`PLAYWRIGHT_PORT` permite escolher outra porta, se necessário). Projetos configurados: Chromium desktop (1440×900), tablet (768×1024) e Pixel 7 (390×844). Os testes gravam traces em falha em `test-results/` e o relatório HTML em `playwright-report/`.

Execuções selecionadas:

```bash
npx playwright test --project=desktop
npx playwright test --project=tablet
npx playwright test --project=mobile
npx playwright test e2e/visual.spec.ts --project=tablet --update-snapshots
npx playwright test e2e/visual.spec.ts --project=desktop
npx playwright test e2e/visual.spec.ts --update-snapshots
```

Os baselines visuais versionados estão em `e2e/__screenshots__/`, organizados por projeto.

### Lighthouse

A auditoria versionada atual, com três execuções por página e perfil, está em [`reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/`](./reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/). Inclui configuração, versões, ambiente, `measurements.csv`, medianas e relatórios HTML/JSON. Para reproduzir uma execução local, inicie a build demo/preview em um terminal:

```bash
npm run build:demo
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Em outro terminal, execute Lighthouse 13.6.0. O caminho de saída deve apontar para um diretório existente; configure `CHROME_PATH` se Lighthouse não localizar automaticamente o Chrome/Chromium instalado:

```bash
mkdir -p reports/lighthouse/reproduction
npx --yes lighthouse@13.6.0 http://127.0.0.1:4173/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=html,json \
  --output-path=reports/lighthouse/reproduction/home-mobile-run-1
```

Para desktop, acrescente `--preset=desktop`; para o detalhe, use `http://127.0.0.1:4173/nft/emerald-ape-042`. Faça três execuções por combinação e use a mediana. A build demo mantém imagens, fontes, funcionalidades e cenário default dos mocks; não bloqueie requisições para elevar pontuações.

## Rotas

| Caminho | Conteúdo | Acesso |
| --- | --- | --- |
| `/` | Destaques e catálogo | Público |
| `/nft/:id` | Detalhe, galeria, edição e compra | Público |
| `/carrinho` | Itens, quantidades e cupom | Público; recursos são associados à sessão/visitante |
| `/login`, `/cadastro` | Autenticação | Público |
| `/pagamento`, `/pedido/:id` | Checkout e recibo/pedido | Autenticado |
| `/favoritos`, `/perfil`, `/carteiras` | Conta do colecionador | Autenticado |

Rotas extras de conteúdo fora do escopo principal têm apresentação de indisponibilidade/placeholder. Refresh e acesso direto são tratados pelo rewrite SPA em `vercel.json`.

## Estrutura do código

- `src/routes/`: definição das rotas TanStack Router; `index.lazy.tsx` e `nft.$id.lazy.tsx` carregam as páginas sob demanda.
- `src/features/`: páginas, componentes, queries e mutations organizados por catálogo, NFTs, favoritos, carrinho, checkout, autenticação e conta.
- `src/contracts/`: schemas Zod compartilhados para respostas, requests, erros e eventos.
- `src/lib/http/`: Axios, timeout, validação e normalização de erros.
- `src/lib/realtime/`: cliente Socket.IO, validação e filtragem de eventos duplicados/antigos.
- `src/mocks/`: handlers MSW, fixtures, estado persistido, cenários, domínio simulado e servidor Socket.IO de teste.
- `public/nft/`: imagens WebP de 320 e 640 px; a interface usa Roboto Mono variável local.
- `e2e/`: fluxos Playwright e snapshots desktop/mobile.

Decisões de estado, contratos e limites da simulação estão em [ARCHITECTURE.md](./ARCHITECTURE.md).

## Build e publicação

Aplicação publicada na Vercel: **[https://nft-marketplace-jg-cyan.vercel.app/](https://nft-marketplace-jg-cyan.vercel.app/)**.

`npm run build:demo` gera a build demonstrável com mocks. `vercel.json` configura esse comando, a pasta `dist`, fallback SPA e os headers necessários ao service worker. A publicação usa o modo demo, então a aplicação pública opera com dados simulados; não há integração com backend ou blockchain de produção.

## Resultados de performance

Na última auditoria, desktop obteve Performance 99 nas duas páginas. Mobile obteve 80 na home e no detalhe, abaixo da meta 90; as medianas de LCP/TBT e as causas observadas estão no [README da auditoria](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/README.md). Não interprete a build de demonstração com MSW como um backend de produção.

Arquivos de resumo e configuração:

- [Medianas por página e perfil](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/medians.json)
- [Medições individuais em CSV](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/measurements.csv)
- [Configuração, ferramentas e ambiente](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/audit-config.json)

Relatórios Lighthouse por execução:

| Página | Perfil | HTML (runs 1–3) | JSON (runs 1–3) |
| --- | --- | --- | --- |
| Home | Mobile | [1](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-mobile-run-1.report.html), [2](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-mobile-run-2.report.html), [3](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-mobile-run-3.report.html) | [1](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-mobile-run-1.report.json), [2](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-mobile-run-2.report.json), [3](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-mobile-run-3.report.json) |
| Home | Desktop | [1](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-desktop-run-1.report.html), [2](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-desktop-run-2.report.html), [3](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-desktop-run-3.report.html) | [1](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-desktop-run-1.report.json), [2](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-desktop-run-2.report.json), [3](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/home-desktop-run-3.report.json) |
| NFT detail | Mobile | [1](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-mobile-run-1.report.html), [2](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-mobile-run-2.report.html), [3](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-mobile-run-3.report.html) | [1](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-mobile-run-1.report.json), [2](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-mobile-run-2.report.json), [3](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-mobile-run-3.report.json) |
| NFT detail | Desktop | [1](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-desktop-run-1.report.html), [2](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-desktop-run-2.report.html), [3](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-desktop-run-3.report.html) | [1](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-desktop-run-1.report.json), [2](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-desktop-run-2.report.json), [3](reports/lighthouse/2026-11-02/nft-home-detail-code-splitting/nft-detail-desktop-run-3.report.json) |
