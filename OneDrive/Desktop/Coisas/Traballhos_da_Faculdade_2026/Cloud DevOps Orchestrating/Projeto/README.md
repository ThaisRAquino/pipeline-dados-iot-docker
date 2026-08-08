# Pedidos Veloz — Entrega Contínua de uma Plataforma de Pedidos em Microsserviços

Projeto da disciplina Cloud DevOps: modernização da plataforma de pedidos da
**Loja Veloz** (e-commerce de médio porte), do ambiente local em Docker
Compose até produção em Kubernetes, com CI/CD, observabilidade e IaC.

📺 **Vídeo pitch:** _[cole aqui o link do YouTube após gravar — roteiro em `docs/roteiro-video-pitch.md`]_

📄 **Relatórios:** `docs/relatorio-teorico.pdf` e `docs/relatorio-tecnico-pratico.pdf`

---

## Arquitetura

```
                        ┌─────────────────┐
   Cliente / Campanha ──▶   API Gateway    │  :3000
                        └────────┬─────────┘
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
        ┌────────────────┐ ┌─────────────┐ ┌────────────────┐
        │ Serviço de      │ │ Serviço de  │ │ Serviço de     │
        │ Pedidos  :3001  │ │ Pagamentos  │ │ Estoque  :3003 │
        │                 │ │   :3002     │ │                │
        └────────┬────────┘ └─────────────┘ └────────┬───────┘
                 │                                     │
                 └──────────────┬──────────────────────┘
                                 ▼
                          ┌─────────────┐
                          │ PostgreSQL  │
                          └─────────────┘

  Todos os serviços exportam /health, /ready, /metrics (Prometheus) e traces
  OpenTelemetry (OTLP) para o otel-collector → Jaeger.
```

**Fluxo de criação de pedido:** o Gateway roteia para o Serviço de Pedidos,
que orquestra de forma síncrona: reserva no Estoque → cobrança em Pagamentos
→ persistência do pedido. Falha em qualquer etapa aciona compensação
(liberação do estoque reservado). Ver justificativa dessa escolha (em vez de
mensageria assíncrona) na seção "Decisões arquiteturais" abaixo e no
relatório técnico.

## Estrutura do repositório

```
pedidos-veloz/
├── services/                    # 4 microsserviços (Node.js/Express)
│   ├── api-gateway/
│   ├── pedidos-service/
│   ├── pagamentos-service/
│   └── estoque-service/
├── db/init.sql                  # schema + dados de exemplo do Postgres
├── docker-compose.yml           # ambiente local (1 comando)
├── docker-compose.observability.yml  # overlay opcional: Prometheus/Grafana/Jaeger/OTel
├── observability/               # configs do Prometheus, OTel Collector, Grafana
├── k8s/                         # manifests de produção mínima (ver k8s/README.md)
├── terraform/                   # esqueleto de IaC (cluster kind local)
├── .github/workflows/ci-cd.yml  # pipeline de CI/CD
└── docs/                        # roteiro do vídeo, checklist de entrega
```

## Como rodar localmente

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Isso sobe API Gateway (`:3000`), Serviço de Pedidos (`:3001`), Pagamentos
(`:3002`), Estoque (`:3003`) e Postgres (`:5432`), com rede e volume
dedicados definidos em `docker-compose.yml`.

### Testar o fluxo completo

```bash
# Criar um pedido (dispara reserva de estoque + pagamento + persistência)
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"clienteId":"cliente-1","itemId":"sku-001","quantidade":2,"valor":59.90}'

# Consultar o pedido criado (troque 1 pelo id retornado acima)
curl http://localhost:3000/api/pedidos/1

# Consultar saldo de um item
curl http://localhost:3000/api/estoque/sku-001
```

### Com observabilidade (Prometheus, Grafana, Jaeger, OTel Collector)

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up --build
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3300 (login: admin/admin)
- Jaeger UI (traces distribuídos): http://localhost:16686

## Subindo em Kubernetes

Ver instruções detalhadas em [`k8s/README.md`](k8s/README.md). Resumo:

```bash
# 1) Provisionar um cluster local com Terraform (ou usar um cluster já existente)
cd terraform && terraform init && terraform apply
export KUBECONFIG=$(terraform output -raw kubeconfig_path)
cd ..

# 2) Aplicar os manifests
cp k8s/02-secrets.example.yaml k8s/02-secrets.yaml   # editar credenciais antes!
kubectl apply -f k8s/
```

## CI/CD

Pipeline em `.github/workflows/ci-cd.yml` (GitHub Actions):

1. **lint-test** — roda em paralelo para os 4 serviços: `node --check` (lint
   sintático) + testes unitários (`npm test`, Node.js test runner nativo).
2. **build** — build da imagem Docker de cada serviço + scan de
   vulnerabilidades com Trivy (não bloqueante no MVP; recomenda-se torná-lo
   bloqueante para CRITICAL após estabilizar o pipeline).
3. **publish** — apenas em push para `main`: publica as imagens no GitHub
   Container Registry (GHCR), com tag pelo SHA do commit e `latest`.
4. **deploy** — ambiente `production` com aprovação manual obrigatória
   (configurar em Settings → Environments do GitHub); aplica os manifests via
   `kubectl` (rolling update nativo do Kubernetes) e faz rollback automático
   se o `kubectl rollout status` falhar.

**Secrets necessários no repositório GitHub:** `KUBE_CONFIG_DATA` (kubeconfig
em base64, apontando para o cluster de produção). O `GITHUB_TOKEN` para o
GHCR é automático, não precisa ser cadastrado.

## Estratégia de deploy

**Rolling update** (nativo do Kubernetes, `maxSurge: 1 / maxUnavailable: 0`)
foi escolhida em vez de Blue-Green ou Canary para o MVP: entrega zero downtime
sem exigir infraestrutura duplicada (custo) nem um controlador de tráfego
adicional (Argo Rollouts/Flagger + service mesh) — que a equipe não tem tempo
de operar em 4 semanas. Justificativa completa e trade-offs no relatório
técnico.

## Escalabilidade

**HPA (Horizontal Pod Autoscaler)** baseado em utilização de CPU em todos os
serviços, com limites diferentes por criticidade (API Gateway e Estoque
escalam até 8–10 réplicas, pois concentram o tráfego de leitura/gravação nos
picos da campanha). VPA não foi adotado neste MVP porque reinicia Pods para
ajustar `resources` (incompatível com rolling update sem downtime) — decisão
detalhada no relatório técnico.

## Observabilidade

- **Métricas:** `prom-client` em cada serviço expõe `/metrics` (latência por
  rota, contadores de negócio como `pedidos_criados_total`); Prometheus
  coleta, Grafana visualiza.
- **Logs:** JSON estruturado em stdout (12-Factor: XI), coletado pela
  plataforma (Docker/Kubernetes) — nenhum serviço escreve em arquivo.
- **Tracing distribuído:** OpenTelemetry SDK instrumentado em todos os 4
  serviços, propagando o contexto de trace via header `traceparent` (W3C)
  entre chamadas HTTP; exportado via OTLP para o Collector → Jaeger.

## Decisões arquiteturais (resumo — detalhes no relatório técnico)

| Decisão | Justificativa resumida |
|---|---|
| Sem mensageria (broker) no MVP | Volume e prazo do MVP não justificam a complexidade operacional de um broker; ponto de extensão via padrão outbox fica documentado para quando o volume justificar. |
| Sem service mesh (Istio) | Apenas 4 serviços; mTLS/traffic shaping trazem complexidade operacional desproporcional ao ganho no MVP. Tracing e métricas já cobrem a necessidade de observabilidade avançada. |
| Postgres em StatefulSet no MVP | Em produção real, recomenda-se um banco gerenciado (RDS/Cloud SQL); StatefulSet aqui serve para manter o ambiente 100% reproduzível/local. |
| Rolling update (não Blue-Green/Canary) | Menor complexidade operacional com boa redução de risco para o prazo de 4 semanas; ver trade-offs no relatório. |
| HPA por CPU (sem VPA) | VPA reinicia Pods para redimensionar, incompatível com deploy zero-downtime. |

## Case de referência pesquisado

Como exemplo concreto de mercado, este projeto se inspira em:

- **[Online Boutique (GoogleCloudPlatform/microservices-demo)](https://github.com/GoogleCloudPlatform/microservices-demo)** — aplicação de referência do Google Cloud com múltiplos microsserviços, Kubernetes, gRPC e observabilidade completa com OpenTelemetry, usada como benchmark de arquitetura cloud-native.
- **[Case público iFood + Amazon EKS](https://aws.amazon.com/pt/solutions/case-studies/ifood-eks-aws-case-study)** — empresa brasileira de varejo/delivery que migrou sua infraestrutura Kubernetes para o Amazon EKS visando maior resiliência, redução de esforço operacional e de custos, validando a direção de evolução proposta no módulo Terraform comentado (`terraform/main.tf`).

## Licença / uso acadêmico

Projeto desenvolvido para fins acadêmicos (disciplina Cloud DevOps).
