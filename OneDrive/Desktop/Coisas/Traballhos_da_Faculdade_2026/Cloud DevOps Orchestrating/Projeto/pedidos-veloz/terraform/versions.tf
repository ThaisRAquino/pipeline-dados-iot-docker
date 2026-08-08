terraform {
  required_version = ">= 1.7.0"

  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.7"
    }
  }

  # Backend local para o MVP/estudo. Em produção, usar backend remoto com
  # state locking (ex.: S3 + DynamoDB, Terraform Cloud, GCS) para permitir
  # colaboração segura entre a equipe. Justificativa no relatório técnico.
  backend "local" {
    path = "terraform.tfstate"
  }
}
