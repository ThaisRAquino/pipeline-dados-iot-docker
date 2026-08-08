output "cluster_name" {
  description = "Nome do cluster kind provisionado"
  value       = kind_cluster.pedidos_veloz.name
}

output "kubeconfig_path" {
  description = "Caminho do kubeconfig gerado para o cluster (usar com kubectl --kubeconfig)"
  value       = kind_cluster.pedidos_veloz.kubeconfig_path
}

output "client_certificate" {
  description = "Certificado de cliente do cluster (sensível)"
  value       = kind_cluster.pedidos_veloz.client_certificate
  sensitive   = true
}
