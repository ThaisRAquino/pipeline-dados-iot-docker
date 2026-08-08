# Esqueleto de IaC para provisionar o cluster Kubernetes usado no MVP.
#
# Por que "kind" (Kubernetes-in-Docker) local em vez de EKS/GKE/AKS neste
# esqueleto?
#   - Custo zero: o desafio pede um MVP em 4 semanas para validação antes da
#     campanha; não faz sentido gerar custo de cloud gerenciada só para provar
#     a arquitetura.
#   - Reprodutibilidade: qualquer dev ou o pipeline de CI roda `terraform apply`
#     e sobe um cluster idêntico em minutos, sem depender de credenciais de nuvem.
#   - O restante da stack (manifests em k8s/, Helm charts de observabilidade)
#     é 100% portável: o mesmo `kubectl apply -f k8s/` funciona em kind ou em
#     um cluster gerenciado real.
#
# Caminho de evolução para produção real (documentado, não aplicado neste
# repositório): ver módulo comentado no final deste arquivo e o relatório
# técnico, seção "Infraestrutura como Código".

provider "kind" {}

resource "kind_cluster" "pedidos_veloz" {
  name           = var.cluster_name
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role  = "control-plane"
      image = var.kubernetes_version

      # Expõe as portas do Ingress Controller (80/443) no host,
      # permitindo acessar a aplicação em http://localhost sem port-forward.
      extra_port_mappings {
        container_port = 80
        host_port       = 80
      }
      extra_port_mappings {
        container_port = 443
        host_port       = 443
      }

      kubeadm_config_patches = [
        "kind: InitConfiguration\nnodeRegistration:\n  kubeletExtraArgs:\n    node-labels: \"ingress-ready=true\"\n"
      ]
    }

    dynamic "node" {
      for_each = range(var.worker_node_count)
      content {
        role  = "worker"
        image = var.kubernetes_version
      }
    }
  }
}

# ---------------------------------------------------------------------------
# EVOLUÇÃO PARA CLOUD GERENCIADA (esqueleto documentado, não instanciado)
# ---------------------------------------------------------------------------
# Quando o tráfego real da campanha exigir um cluster gerenciado, o módulo
# abaixo (comentado) mostra a direção recomendada usando o módulo oficial e
# amplamente adotado terraform-aws-modules/eks/aws — o mesmo tipo de
# abordagem usada pelo case público da iFood ao migrar para o Amazon EKS
# (ver relatório técnico para a referência completa).
#
# module "eks" {
#   source          = "terraform-aws-modules/eks/aws"
#   version         = "~> 20.0"
#   cluster_name    = "pedidos-veloz-prod"
#   cluster_version = "1.30"
#
#   vpc_id     = module.vpc.vpc_id
#   subnet_ids = module.vpc.private_subnets
#
#   eks_managed_node_groups = {
#     default = {
#       min_size       = 2
#       max_size       = 10
#       desired_size   = 3
#       instance_types = ["t3.medium"]
#     }
#   }
# }
