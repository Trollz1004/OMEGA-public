# AWS Deployment Guide

Complete guide for deploying the dating platform on Amazon Web Services.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [VPC and Network Setup](#vpc-and-network-setup)
4. [RDS PostgreSQL Setup](#rds-postgresql-setup)
5. [ElastiCache Redis Setup](#elasticache-redis-setup)
6. [S3 Storage Setup](#s3-storage-setup)
7. [EC2 Deployment](#ec2-deployment)
8. [ECS Deployment (Alternative)](#ecs-deployment-alternative)
9. [CloudFront CDN](#cloudfront-cdn)
10. [Route 53 DNS](#route-53-dns)
11. [SSL/TLS Certificates](#ssltls-certificates)
12. [Monitoring and Logging](#monitoring-and-logging)
13. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

```
                                    ┌─────────────────┐
                                    │   Route 53      │
                                    │   (DNS)         │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  CloudFront     │
                                    │  (CDN)          │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                     ┌────────▼────┐  ┌──────▼──────┐  ┌───▼───┐
                     │    ALB      │  │    S3       │  │  S3   │
                     │ (API/WebSocket) (Static)     │  │(Media)│
                     └────────┬────┘  └─────────────┘  └───────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
        ┌──────▼──────┐┌──────▼──────┐┌──────▼──────┐
        │   EC2/ECS   ││   EC2/ECS   ││   EC2/ECS   │
        │  (App 1)    ││  (App 2)    ││  (App 3)    │
        └──────┬──────┘└──────┬──────┘└──────┬──────┘
               │              │              │
               └──────────────┼──────────────┘
                              │
               ┌──────────────┼──────────────┐
               │                             │
        ┌──────▼──────┐              ┌───────▼──────┐
        │     RDS     │              │ ElastiCache  │
        │ (PostgreSQL)│              │   (Redis)    │
        └─────────────┘              └──────────────┘
```

---

## Prerequisites

### Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download from https://aws.amazon.com/cli/
```

### Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region name: us-east-1
# Default output format: json
```

### Install Additional Tools

```bash
# Terraform (recommended for infrastructure)
brew install terraform

# Docker (for ECS deployment)
brew install docker
```

---

## VPC and Network Setup

### Create VPC with Terraform

Create `infrastructure/aws/vpc.tf`:

```hcl
provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "dating-platform-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "dating-platform-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "dating-platform-public-${count.index + 1}"
    Type = "public"
  }
}

# Private Subnets (for RDS, ElastiCache)
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "dating-platform-private-${count.index + 1}"
    Type = "private"
  }
}

# NAT Gateway for private subnets
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "dating-platform-nat"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "dating-platform-public-rt"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "dating-platform-private-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "dating-platform-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name        = "dating-platform-app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["YOUR_IP/32"]  # Replace with your IP
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  name        = "dating-platform-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}

resource "aws_security_group" "redis" {
  name        = "dating-platform-redis-sg"
  description = "Security group for ElastiCache"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}
```

### Apply VPC Configuration

```bash
cd infrastructure/aws
terraform init
terraform plan
terraform apply
```

---

## RDS PostgreSQL Setup

### Create RDS with Terraform

Add to `infrastructure/aws/rds.tf`:

```hcl
resource "aws_db_subnet_group" "main" {
  name       = "dating-platform-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "Dating Platform DB Subnet Group"
  }
}

resource "aws_db_parameter_group" "postgres" {
  family = "postgres15"
  name   = "dating-platform-postgres"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "dating-platform-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"  # Adjust based on needs

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "dating_platform"
  username = "dating_admin"
  password = var.db_password  # Use AWS Secrets Manager in production

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "dating-platform-final-snapshot"

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "dating-platform-db"
    Environment = var.environment
  }
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "dating-platform-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

variable "db_password" {
  sensitive = true
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}
```

### Manual RDS Setup (AWS Console)

1. Go to **RDS Console** > **Create database**
2. Choose **PostgreSQL** > Version 15.x
3. Select **Production** template
4. Settings:
   - DB instance identifier: `dating-platform-db`
   - Master username: `dating_admin`
   - Master password: Generate or set secure password
5. Instance configuration: `db.t3.medium` (or larger)
6. Storage: 100 GB GP3, enable autoscaling
7. Connectivity:
   - VPC: `dating-platform-vpc`
   - Subnet group: Create new with private subnets
   - Public access: No
   - Security group: `dating-platform-rds-sg`
8. Enable Multi-AZ deployment
9. Create database

### Database Initialization

```bash
# Connect to RDS via bastion host or EC2 instance
psql -h dating-platform-db.xxx.us-east-1.rds.amazonaws.com \
     -U dating_admin -d dating_platform

# Run migrations
DATABASE_URL="postgresql://dating_admin:PASSWORD@dating-platform-db.xxx.us-east-1.rds.amazonaws.com:5432/dating_platform" \
  npm run db:migrate
```

---

## ElastiCache Redis Setup

### Create ElastiCache with Terraform

Add to `infrastructure/aws/elasticache.tf`:

```hcl
resource "aws_elasticache_subnet_group" "main" {
  name       = "dating-platform-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "dating-platform-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "dating-platform-redis"
  description         = "Redis cluster for dating platform"

  node_type            = "cache.t3.medium"
  num_cache_clusters   = 2  # Primary + 1 replica
  port                 = 6379

  engine               = "redis"
  engine_version       = "7.0"
  parameter_group_name = aws_elasticache_parameter_group.redis.name

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  automatic_failover_enabled = true
  multi_az_enabled          = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token  # Use Secrets Manager

  snapshot_retention_limit = 7
  snapshot_window         = "05:00-06:00"

  tags = {
    Name        = "dating-platform-redis"
    Environment = var.environment
  }
}

variable "redis_auth_token" {
  sensitive = true
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}
```

### Manual ElastiCache Setup (AWS Console)

1. Go to **ElastiCache Console** > **Create cluster**
2. Select **Redis**
3. Cluster mode: **Disabled** (for simpler setup)
4. Settings:
   - Name: `dating-platform-redis`
   - Node type: `cache.t3.medium`
   - Number of replicas: 2
5. Subnet group: Create new with private subnets
6. Security group: `dating-platform-redis-sg`
7. Enable encryption at rest and in transit
8. Set AUTH token
9. Create

---

## S3 Storage Setup

### Create S3 Buckets with Terraform

Add to `infrastructure/aws/s3.tf`:

```hcl
# Media Storage Bucket (user uploads)
resource "aws_s3_bucket" "media" {
  bucket = "dating-platform-media-${var.environment}"

  tags = {
    Name        = "dating-platform-media"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://yourdomain.com"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    id     = "move-to-ia"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Static Assets Bucket
resource "aws_s3_bucket" "static" {
  bucket = "dating-platform-static-${var.environment}"
}

resource "aws_s3_bucket_website_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_policy" "static" {
  bucket = aws_s3_bucket.static.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "CloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

# IAM Policy for Application Access
resource "aws_iam_policy" "s3_access" {
  name = "dating-platform-s3-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.media.arn,
          "${aws_s3_bucket.media.arn}/*"
        ]
      }
    ]
  })
}

output "media_bucket_name" {
  value = aws_s3_bucket.media.id
}

output "static_bucket_name" {
  value = aws_s3_bucket.static.id
}
```

### S3 Environment Configuration

Add to your application's environment:

```bash
AWS_S3_BUCKET=dating-platform-media-production
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

---

## EC2 Deployment

### Launch EC2 Instance with Terraform

Add to `infrastructure/aws/ec2.tf`:

```hcl
# Key Pair
resource "aws_key_pair" "main" {
  key_name   = "dating-platform-key"
  public_key = file("~/.ssh/dating-platform.pub")
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "dating-platform-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker git
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user

    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Install Node.js
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs

    # Install PM2
    npm install -g pm2

    # Clone application (or use CodeDeploy)
    cd /home/ec2-user
    git clone https://github.com/yourusername/dating-platform.git
    cd dating-platform
    npm install
    npm run build

    # Start application
    pm2 start npm --name "dating-api" -- start
    pm2 startup
    pm2 save
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "dating-platform-app"
    }
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "dating-platform-asg"
  vpc_zone_identifier = aws_subnet.public[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"

  min_size         = 2
  max_size         = 10
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "dating-platform-app"
    propagate_at_launch = true
  }
}

# Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "dating-platform-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "dating-platform-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# CloudWatch Alarms for Scaling
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "dating-platform-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions = [aws_autoscaling_policy.scale_up.arn]
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "dating-platform-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 30

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions = [aws_autoscaling_policy.scale_down.arn]
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "dating-platform-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true
}

resource "aws_lb_target_group" "app" {
  name     = "dating-platform-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# IAM Role for EC2
resource "aws_iam_role" "app" {
  name = "dating-platform-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "app_s3" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_role_policy_attachment" "app_ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "app" {
  name = "dating-platform-app-profile"
  role = aws_iam_role.app.name
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}
```

### Manual EC2 Deployment

```bash
# SSH into EC2 instance
ssh -i ~/.ssh/dating-platform.pem ec2-user@<instance-ip>

# Setup application
sudo yum update -y
sudo yum install -y git nodejs npm

# Clone and build
git clone https://github.com/yourusername/dating-platform.git
cd dating-platform
npm install
npm run build

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://dating_admin:PASSWORD@dating-platform-db.xxx.us-east-1.rds.amazonaws.com:5432/dating_platform
REDIS_URL=rediss://:AUTH_TOKEN@dating-platform-redis.xxx.cache.amazonaws.com:6379
AWS_S3_BUCKET=dating-platform-media-production
JWT_SECRET=your-secure-jwt-secret
EOF

# Start with PM2
npm install -g pm2
pm2 start npm --name "dating-api" -- start
pm2 startup
pm2 save
```

---

## ECS Deployment (Alternative)

### Create ECS Cluster with Terraform

Add to `infrastructure/aws/ecs.tf`:

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "dating-platform-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = "dating-platform"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "dating-platform"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "dating-platform"
      image = "${aws_ecr_repository.app.repository_url}:latest"

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.db_url.arn}"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.redis_url.arn}"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.jwt_secret.arn}"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "dating-platform-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "dating-platform"
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "dating-platform-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70
  }
}

# IAM Roles
resource "aws_iam_role" "ecs_execution" {
  name = "dating-platform-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "dating-platform-secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_url.arn,
          aws_secretsmanager_secret.redis_url.arn,
          aws_secretsmanager_secret.jwt_secret.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "dating-platform-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_s3" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/dating-platform"
  retention_in_days = 30
}

# Secrets Manager
resource "aws_secretsmanager_secret" "db_url" {
  name = "dating-platform/database-url"
}

resource "aws_secretsmanager_secret" "redis_url" {
  name = "dating-platform/redis-url"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "dating-platform/jwt-secret"
}
```

### Docker Build and Push

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

Push to ECR:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t dating-platform .
docker tag dating-platform:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/dating-platform:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/dating-platform:latest

# Update ECS service
aws ecs update-service --cluster dating-platform-cluster --service dating-platform-service --force-new-deployment
```

---

## CloudFront CDN

### Create CloudFront Distribution

Add to `infrastructure/aws/cloudfront.tf`:

```hcl
# Origin Access Control
resource "aws_cloudfront_origin_access_control" "static" {
  name                              = "dating-platform-static-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["yourdomain.com", "www.yourdomain.com"]
  price_class         = "PriceClass_100"

  # API Origin (ALB)
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Static Assets Origin (S3)
  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = "static"
    origin_access_control_id = aws_cloudfront_origin_access_control.static.id
  }

  # Media Origin (S3)
  origin {
    domain_name              = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id                = "media"
    origin_access_control_id = aws_cloudfront_origin_access_control.static.id
  }

  # Default behavior (API)
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # Static assets behavior
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  # Media behavior
  ordered_cache_behavior {
    path_pattern     = "/media/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "media"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  # Error pages
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name        = "dating-platform-cdn"
    Environment = var.environment
  }
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_id" {
  value = aws_cloudfront_distribution.main.id
}
```

### Invalidate CloudFront Cache

```bash
# After deploying new static assets
aws cloudfront create-invalidation \
  --distribution-id EXAMPLEID \
  --paths "/*"
```

---

## Route 53 DNS

### Create Hosted Zone and Records

Add to `infrastructure/aws/route53.tf`:

```hcl
# Hosted Zone
resource "aws_route53_zone" "main" {
  name = "yourdomain.com"
}

# A Record for root domain
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "yourdomain.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# A Record for www subdomain
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.yourdomain.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# API subdomain (direct to ALB, bypassing CloudFront if needed)
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.yourdomain.com"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Health Check
resource "aws_route53_health_check" "main" {
  fqdn              = "api.yourdomain.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "dating-platform-health-check"
  }
}

output "nameservers" {
  value = aws_route53_zone.main.name_servers
}
```

### Update Domain Registrar

After creating the hosted zone, update your domain registrar's nameservers to the Route 53 nameservers.

---

## SSL/TLS Certificates

### Create ACM Certificate

Add to `infrastructure/aws/acm.tf`:

```hcl
# Certificate (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "main" {
  provider          = aws.us_east_1
  domain_name       = "yourdomain.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.yourdomain.com"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# DNS Validation Records
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Provider for us-east-1 (required for CloudFront certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
```

---

## Monitoring and Logging

### CloudWatch Dashboard

Add to `infrastructure/aws/monitoring.tf`:

```hcl
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "dating-platform"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          title  = "ECS Service Metrics"
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeStorageSpace", ".", "."]
          ]
          title  = "RDS Metrics"
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          title  = "ALB Metrics"
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CurrConnections", "CacheClusterId", "${aws_elasticache_replication_group.main.id}-001"],
            [".", "CacheHits", ".", "."],
            [".", "CacheMisses", ".", "."]
          ]
          title  = "Redis Metrics"
          period = 300
          stat   = "Average"
        }
      }
    ]
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "dating-platform-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "alerts@yourdomain.com"
}

# Critical Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "dating-platform-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "dating-platform-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High rate of 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}
```

---

## Cost Optimization

### Estimated Monthly Costs

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| EC2/ECS | 2x t3.medium | ~$60/month |
| RDS | db.t3.medium Multi-AZ | ~$120/month |
| ElastiCache | cache.t3.medium | ~$50/month |
| ALB | 1 ALB | ~$20/month |
| CloudFront | 100GB transfer | ~$10/month |
| S3 | 100GB storage | ~$3/month |
| Route 53 | 1 hosted zone | ~$0.50/month |
| **Total** | | **~$265/month** |

### Cost Saving Tips

1. **Use Reserved Instances** - Save up to 72% on EC2 and RDS
2. **Use Fargate Spot** - Save up to 70% on ECS tasks
3. **Enable S3 Intelligent Tiering** - Automatic cost optimization
4. **Right-size instances** - Start small, scale as needed
5. **Use CloudFront caching** - Reduce origin requests

### Reserved Instance Purchase

```bash
# View RI recommendations
aws ce get-reservation-purchase-recommendation \
  --service "Amazon Elastic Compute Cloud - Compute" \
  --lookback-period-in-days SIXTY_DAYS
```

---

## Deployment Checklist

Before going live, ensure:

- [ ] VPC and subnets created
- [ ] Security groups configured
- [ ] RDS PostgreSQL running with Multi-AZ
- [ ] ElastiCache Redis cluster running
- [ ] S3 buckets created with proper policies
- [ ] EC2/ECS instances running application
- [ ] ALB configured with health checks
- [ ] CloudFront distribution active
- [ ] SSL certificate validated
- [ ] Route 53 DNS configured
- [ ] CloudWatch alarms set up
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Backup policies verified

---

## CI/CD Pipeline

### GitHub Actions for ECS

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: dating-platform
  ECS_SERVICE: dating-platform-service
  ECS_CLUSTER: dating-platform-cluster

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Update ECS service
        run: |
          aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment
```

---

## Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check ECS task logs
aws logs tail /ecs/dating-platform --follow

# Check EC2 instance logs
sudo journalctl -u dating-platform -f
```

**Database connection issues:**
```bash
# Test connectivity from EC2
nc -zv dating-platform-db.xxx.us-east-1.rds.amazonaws.com 5432

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxx
```

**Redis connection issues:**
```bash
# Test Redis connectivity
redis-cli -h dating-platform-redis.xxx.cache.amazonaws.com -p 6379 --tls ping
```

**SSL certificate not working:**
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:xxx:certificate/xxx
```

---

## Support

For issues with this deployment guide, please open an issue in the repository or contact the DevOps team.
