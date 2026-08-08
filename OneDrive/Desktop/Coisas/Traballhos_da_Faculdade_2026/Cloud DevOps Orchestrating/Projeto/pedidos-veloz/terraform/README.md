# Terraform — Provisionamento do Cluster

Este é um **esqueleto de IaC**, propositalmente simples, para provisionar um
cluster Kubernetes local (via [kind](https://kind.sigs.k8s.io/)) usando o
provider [`tehcyx/kind`](https://registry.terraform.io/providers/tehcyx/kind).

## Por que kind e não um provedor cloud real?

Ver comentário no topo de `main.tf`. Resumo: custo zero, reprodutibilidade
total (qualquer pessoa ou o CI provisiona o cluster em minutos) e paridade de
manifests — os mesmos YAMLs em `k8s/` aplicam tanto no kind quanto em um EKS/
GKE/AKS real. O módulo comentado em `main.tf` mostra a direção para migrar
para Amazon EKS usando o módulo oficial `terraform-aws-modules/eks/aws`,
inspirado no case público da iFood (migração para Amazon EKS).

## Uso

```bash
cd terraform
terraform init
terraform plan
terraform apply

# Exportar o kubeconfig gerado
export KUBECONFIG=$(terraform output -raw kubeconfig_path)
kubectl get nodes

# Destruir o cluster ao final dos testes
terraform destroy
```

## Estrutura

| Arquivo         | Conteúdo                                            |
|-----------------|------------------------------------------------------|
| `versions.tf`   | Requisitos de versão do Terraform/provider e backend  |
| `variables.tf`  | Variáveis parametrizáveis (nome do cluster, nº de nós, versão do K8s) |
| `main.tf`       | Recurso `kind_cluster` + módulo comentado para EKS    |
| `outputs.tf`    | Nome do cluster e caminho do kubeconfig gerado        |

## Boas práticas aplicadas (e o que falta para produção real)

- **Variáveis** em vez de valores fixos (`cluster_name`, `worker_node_count`, versão do K8s).
- **State local** neste esqueleto por simplicidade; para produção/equipe,
  trocar `backend "local"` por um backend remoto com *state locking*
  (S3+DynamoDB, Terraform Cloud ou GCS) — evita que dois membros do time
  apliquem mudanças conflitantes ao mesmo tempo.
- **Módulos**: a estrutura já separa variáveis/outputs/recursos; ao evoluir
  para múltiplos ambientes (dev/staging/prod), o próximo passo é extrair
  `main.tf` para um módulo reutilizável em `modules/k8s-cluster/` e
  instanciá-lo por ambiente com `.tfvars` diferentes.
