variable "cluster_name" {
  description = "Nome do cluster Kubernetes local (kind)"
  type        = string
  default     = "pedidos-veloz"
}

variable "kubernetes_version" {
  description = "Versão da imagem de nó do kind (deve corresponder a uma release do kindest/node)"
  type        = string
  default     = "kindest/node:v1.30.0"
}

variable "worker_node_count" {
  description = "Número de nós worker além do control-plane (simula um cluster multi-nó para testar o HPA/afinidade de Pods)"
  type        = number
  default     = 2
}

variable "environment" {
  description = "Ambiente lógico (usado em tags/labels)"
  type        = string
  default     = "local-dev"
}
