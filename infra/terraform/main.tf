# ==============================================================================
# P25: Infrastructure as Code (Terraform)
# Network, DB, Redis, Object Storage with Remote Backend & State Locking
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  # P25: Remote backend with state locking (Strictly prohibits laptop clickops)
  backend "s3" {
    bucket         = "javamifi-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "javamifi-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "JavaMifiCompass"
      Environment = var.environment
      ManagedBy   = "Terraform-CI"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "environment" {
  type    = string
  default = "production"
}

# --- VPC & Network Architecture ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "javamifi-vpc-${var.environment}"
  }
}

# Private Data Subnets (Database & Redis — NEVER public)
resource "aws_subnet" "private_data_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.20.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false

  tags = {
    Name = "javamifi-private-data-a"
    Tier = "Data"
  }
}

resource "aws_subnet" "private_data_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.21.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = false

  tags = {
    Name = "javamifi-private-data-b"
    Tier = "Data"
  }
}

# App Tier Subnets
resource "aws_subnet" "private_app_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.10.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false

  tags = {
    Name = "javamifi-private-app-a"
    Tier = "Application"
  }
}

# --- Security Groups (Zero Public Exposure on Data Stores) ---
resource "aws_security_group" "app_sg" {
  name        = "javamifi-app-sg"
  description = "Security group for JavaMifi core API & worker containers"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# PostgreSQL Database Security Group — Only accepts traffic from app_sg
resource "aws_security_group" "db_sg" {
  name        = "javamifi-db-sg"
  description = "Security group for PostgreSQL RDS (Strictly isolated)"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL access from application containers only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  tags = {
    Name = "javamifi-db-sg"
  }
}

# Redis ElastiCache Security Group — Only accepts traffic from app_sg
resource "aws_security_group" "redis_sg" {
  name        = "javamifi-redis-sg"
  description = "Security group for Redis cache and BullMQ queues"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis access from application containers only"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  tags = {
    Name = "javamifi-redis-sg"
  }
}

# --- Database Tier: RDS PostgreSQL ---
resource "aws_db_subnet_group" "db" {
  name       = "javamifi-db-subnet-group"
  subnet_ids = [aws_subnet.private_data_a.id, aws_subnet.private_data_b.id]
}

resource "aws_db_instance" "postgres" {
  identifier             = "javamifi-postgres-${var.environment}"
  allocated_storage      = 50
  max_allocated_storage  = 200
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = "db.t4g.medium"
  db_name                = "javamifi"
  username               = "javamifi_admin"
  password               = "vault_managed_secret_placeholder"
  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  publicly_accessible    = false # P25 Invariant: Never expose DB publicly
  storage_encrypted      = true
  skip_final_snapshot    = false
  deletion_protection    = true
}

# --- Cache & Queues: Redis ElastiCache ---
resource "aws_elasticache_subnet_group" "redis" {
  name       = "javamifi-redis-subnet-group"
  subnet_ids = [aws_subnet.private_data_a.id, aws_subnet.private_data_b.id]
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "javamifi-redis-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis_sg.id]
}

# --- Object Storage: Private S3 Bucket for Media ---
resource "aws_s3_bucket" "media" {
  bucket = "javamifi-media-storage-${var.environment}"
}

resource "aws_s3_bucket_public_access_block" "media_block" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media_crypto" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
