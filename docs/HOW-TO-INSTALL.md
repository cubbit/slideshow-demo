# Cubbit Slideshow Demo - Installation Guide

This comprehensive guide will help you deploy the Cubbit Slideshow Demo application in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Kubernetes Deployment with Helm](#kubernetes-deployment-with-helm)
    - [Quick Start](#quick-start)
    - [Detailed Installation Steps](#detailed-installation-steps)
    - [Configuration Options](#configuration-options)
- [Advanced Configuration](#advanced-configuration)
    - [TLS/SSL Setup](#tlsssl-setup)
    - [Resource Configuration](#resource-configuration)
    - [Authentication Settings](#authentication-settings)
- [Troubleshooting](#troubleshooting)
- [Application Access](#application-access)
- [Uninstalling](#uninstalling)

## Prerequisites

Before installation, ensure you have:

- A running Kubernetes cluster (v1.19+)
- Helm (v3.2.0+) installed
- Access to a Cubbit DS3 or S3-compatible storage service with:
    - Bucket name
    - Access Key ID
    - Secret Access Key
    - Endpoint URL
    - Region information
- (Optional) TLS certificate for HTTPS

## Kubernetes Deployment with Helm

### Quick Start

If you're familiar with Kubernetes and Helm, here's a quick start guide:

1. Create a custom values file:

```bash
# Create a copy of the default values to customize
cp helm/values.yaml my-values.yaml
```

2. Edit `my-values.yaml` to include your S3 credentials:

```yaml
# Minimum required configuration
cubbit:
    S3_BUCKET_NAME: 'your-bucket-name'
    S3_REGION: 'eu-central-1' # Change if needed
    S3_ACCESS_KEY_ID: 'your-access-key-id' # Required
    S3_SECRET_ACCESS_KEY: 'your-secret-key' # Required
    S3_ENDPOINT: 'https://your-s3-endpoint' # Required

# Change default admin credentials!
auth:
    username: 'admin'
    password: 'change-me-in-production'
    jwtSecret: 'change-this-to-a-long-random-string'
```

3. Install the chart:

```bash
helm install slideshow ./helm -f my-values.yaml
```

### Detailed Installation Steps

For a more detailed installation with all options configured:

#### 1. Prepare your TLS certificate (if using HTTPS)

If you have an existing certificate from Let's Encrypt/certbot:

```bash
kubectl create secret tls slideshow-tls --key /path/to/privkey.pem --cert /path/to/fullchain.pem
```

If you're using cert-manager, you can configure your Ingress to use a ClusterIssuer in your values file instead.

#### 2. Prepare your values file

Create a file named `my-values.yaml` with full configuration:

```yaml
# Image configuration
image:
    repository: cubbit/slideshow-demo
    pullPolicy: Always
    tag: 'latest'

# Kubernetes Service configuration
service:
    type: ClusterIP
    port: 80
    targetPort: 3000

# Ingress configuration
ingress:
    enabled: true
    className: 'nginx'
    annotations:
        kubernetes.io/ingress.class: nginx
        # Uncomment if using cert-manager
        # cert-manager.io/cluster-issuer: letsencrypt-prod
    hosts:
        - host: slideshow.example.com # Change to your domain
          paths:
              - path: /
                pathType: Prefix
    tls:
        - secretName: slideshow-tls
          hosts:
              - slideshow.example.com # Change to your domain

# Pod resources
resources:
    limits:
        cpu: 500m
        memory: 512Mi
    requests:
        cpu: 100m
        memory: 256Mi

# Authentication for settings page
auth:
    username: 'admin' # Change this to a secure username
    password: 'change-me-in-production' # Change this to a secure password
    jwtSecret: 'change-this-to-a-long-random-string' # Change this to a secure random string

# Logging level
loggingLevel: 'info' # Options: error, warn, info, debug, verbose

# S3 configuration
cubbit:
    # Public settings
    S3_BUCKET_NAME: 'your-bucket-name' # Change this
    MAX_FILE_SIZE: '10485760' # 10MB in bytes
    SLIDESHOW_SPEED_S: '40' # Animation speed in seconds
    MIN_COUNT_FOR_MARQUEE: '6' # Min images needed for animation

    # Private settings (stored as secrets)
    S3_REGION: 'eu-central-1' # Change if needed
    S3_ACCESS_KEY_ID: 'your-access-key-id' # Required
    S3_SECRET_ACCESS_KEY: 'your-secret-key' # Required
    S3_ENDPOINT: 'https://your-s3-endpoint' # Required
    MULTIPART_THRESHOLD: '5242880' # 5MB in bytes
```

#### 3. Install the chart

```bash
# Using Helm 3
helm install slideshow ./helm -f my-values.yaml
```

#### 4. Verify the installation

```bash
# Check if pods are running
kubectl get pods

# Check if ingress is configured
kubectl get ing

# Check the logs of the application
kubectl logs -l app.kubernetes.io/name=cubbit-slideshow
```

### Configuration Options

| Parameter                      | Description                              | Default                                                                      |
| ------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `replicaCount`                 | Number of replicas to run                | `1`                                                                          |
| `image.repository`             | Docker image repository                  | `cubbit/slideshow-demo`                                                      |
| `image.tag`                    | Docker image tag                         | `latest`                                                                     |
| `image.pullPolicy`             | Image pull policy                        | `Always`                                                                     |
| `service.type`                 | Kubernetes Service type                  | `ClusterIP`                                                                  |
| `service.port`                 | Service port                             | `80`                                                                         |
| `service.targetPort`           | Container port                           | `3000`                                                                       |
| `ingress.enabled`              | Enable Ingress                           | `true`                                                                       |
| `ingress.className`            | Ingress class name                       | `nginx`                                                                      |
| `ingress.hosts`                | Array of ingress hosts                   | `[{host: "slideshow.local", paths: [{path: "/", pathType: "Prefix"}]}]`      |
| `ingress.tls`                  | Array of ingress TLS configs             | `[{secretName: "slideshow-tls", hosts: ["slideshow.local"]}]`                |
| `resources`                    | CPU/Memory resource requests/limits      | `{limits: {cpu: 500m, memory: 512Mi}, requests: {cpu: 100m, memory: 256Mi}}` |
| `auth.username`                | Admin username                           | `admin`                                                                      |
| `auth.password`                | Admin password                           | `admin`                                                                      |
| `auth.jwtSecret`               | JWT secret for auth tokens               | `change-this-to-a-random-secure-string-in-production`                        |
| `loggingLevel`                 | Application logging level                | `info`                                                                       |
| `cubbit.S3_BUCKET_NAME`        | S3 bucket name                           | `slideshow`                                                                  |
| `cubbit.MAX_FILE_SIZE`         | Max upload file size in bytes            | `10485760`                                                                   |
| `cubbit.SLIDESHOW_SPEED_S`     | Slideshow animation speed in seconds     | `200`                                                                        |
| `cubbit.MIN_COUNT_FOR_MARQUEE` | Min images for carousel animation        | `6`                                                                          |
| `cubbit.S3_REGION`             | S3 region                                | `eu-central-1`                                                               |
| `cubbit.S3_ACCESS_KEY_ID`      | S3 access key ID                         | `""`                                                                         |
| `cubbit.S3_SECRET_ACCESS_KEY`  | S3 secret access key                     | `""`                                                                         |
| `cubbit.S3_ENDPOINT`           | S3 endpoint URL                          | `""`                                                                         |
| `cubbit.MULTIPART_THRESHOLD`   | Threshold for multipart uploads in bytes | `5242880`                                                                    |

## Advanced Configuration

### TLS/SSL Setup

For production environments, it's recommended to use HTTPS. There are two main approaches:

**1. Using an existing TLS certificate:**

```bash
# Create a secret with your certificate
kubectl create secret tls slideshow-tls --key /path/to/privkey.pem --cert /path/to/fullchain.pem
```

Then in your `my-values.yaml`:

```yaml
ingress:
    tls:
        - secretName: slideshow-tls
          hosts:
              - slideshow.example.com
```

**2. Using cert-manager:**

If you have cert-manager installed, add these annotations to your Ingress:

```yaml
ingress:
    annotations:
        cert-manager.io/cluster-issuer: letsencrypt-prod
```

### Resource Configuration

For production workloads, adjust the CPU and memory based on expected usage:

```yaml
resources:
    limits:
        cpu: 1000m
        memory: 1024Mi
    requests:
        cpu: 200m
        memory: 512Mi
```

### Authentication Settings

For production use, change the default credentials to strong, random values:

```yaml
auth:
    username: 'your-secure-username'
    password: 'your-very-strong-password'
    jwtSecret: 'your-long-random-string-at-least-32-characters'
```

## Troubleshooting

### Common Issues

1. **Pod fails to start**:

    - Check the logs: `kubectl logs -l app.kubernetes.io/name=cubbit-slideshow`
    - Verify S3 credentials are correct
    - Ensure the S3 bucket exists and is accessible

2. **Unable to access the application**:

    - Check if Ingress is properly configured: `kubectl get ing`
    - Verify DNS is pointing to your Kubernetes cluster
    - Check if TLS certificate is valid

3. **Failed uploads**:
    - Check if the S3 access key has write permissions
    - Verify the file size is within the configured limits
    - Ensure the S3 endpoint is accessible from your cluster

### Running Without Ingress

If you prefer not to use Ingress, you can disable it and use port forwarding instead:

```yaml
# In my-values.yaml
ingress:
    enabled: false
```

Then use port forwarding to access the application:

```bash
kubectl port-forward svc/slideshow-cubbit-slideshow 8080:80
```

And access the application at:

- <http://localhost:8080/upload>
- <http://localhost:8080/slideshow>
- <http://localhost:8080/settings>

## Application Access

Once deployed, you can access these endpoints:

- `/upload` - Photo upload interface
- `/slideshow` - Photo slideshow view
- `/settings` - Admin settings page (requires authentication)

## Uninstalling

To remove the Cubbit Slideshow Demo from your cluster:

```bash
helm uninstall slideshow
```

This will remove all resources except for PersistentVolumeClaims and Secrets. To delete them as well:

```bash
# If you need to clean up secrets
kubectl delete secret slideshow-cubbit-slideshow-secret
```

Note that this does not delete any data from your S3 bucket.
