# Manifests Kubernetes — Pedidos Veloz

Aplicar na ordem (os arquivos já são numerados):

```bash
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml

# Copie 02-secrets.example.yaml para 02-secrets.yaml, edite os valores e aplique:
cp 02-secrets.example.yaml 02-secrets.yaml
kubectl apply -f 02-secrets.yaml

kubectl apply -f 03-postgres.yaml
kubectl apply -f 04-api-gateway.yaml
kubectl apply -f 05-pedidos-service.yaml
kubectl apply -f 06-pagamentos-service.yaml
kubectl apply -f 07-estoque-service.yaml
kubectl apply -f 08-networkpolicy.yaml
kubectl apply -f 09-ingress.yaml       # requer ingress-nginx instalado
kubectl apply -f 10-otel-collector.yaml
```

Ou tudo de uma vez (a ordem numérica garante a sequência correta):

```bash
kubectl apply -f k8s/
```

## Pré-requisitos do cluster

- **metrics-server** instalado (necessário para o HPA funcionar):
  ```bash
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  ```
- **ingress-nginx** (se for usar o Ingress):
  ```bash
  helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
  ```
- **kube-prometheus-stack** (Prometheus + Grafana + Alertmanager, produção):
  ```bash
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm install kube-prometheus prometheus-community/kube-prometheus-stack -n observability --create-namespace
  ```
- **Jaeger** (tracing, via jaeger-operator ou all-in-one para demo):
  ```bash
  helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
  helm install jaeger jaegertracing/jaeger -n observability
  ```

Optamos por instalar Prometheus/Grafana/Jaeger via Helm charts oficiais (como
faz a maioria das referências de mercado, ex. o projeto Online Boutique do
Google Cloud) em vez de escrever manifests brutos para eles: são componentes
de infraestrutura compartilhada, não código da aplicação, e os charts já
tratam upgrade, RBAC e storage corretamente.

## Por que não StatefulSet para os 4 serviços de aplicação?

Todos são **stateless** (12-Factor: VI - Processes) — nenhum guarda estado em
disco local; o único estado persistente é o Postgres (StatefulSet). Isso
permite escalar/reiniciar os Pods de aplicação livremente sem coordenação.

## Segurança aplicada

- Pod Security Admission `restricted` no namespace inteiro.
- `runAsNonRoot`, `allowPrivilegeEscalation: false`, `capabilities: drop [ALL]`,
  `readOnlyRootFilesystem: true` em todos os containers de aplicação.
- NetworkPolicies com *default-deny* + liberações explícitas (menor privilégio).
- Secrets separados de ConfigMaps; nenhuma credencial no código-fonte ou em imagem.
