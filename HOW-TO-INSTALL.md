# Quick Start Guide - Cubbit Slideshow Helm Chart

This guide will help you deploy the Cubbit Slideshow Demo application on Kubernetes with minimal effort.

## Prerequisites

- A Kubernetes cluster
- Helm installed
- Access to a Cubbit DS3 or S3-compatible storage service
- (Optional) TLS certificate for SSL if using Ingress

## Installation in 4 Easy Steps

### 1. Prepare your TLS certificate (if using SSL)

If you have an existing certificate from certbot:

```bash
kubectl create secret tls slideshow-tls --key /path/to/privkey.pem --cert /path/to/fullchain.pem
```

### 2. Prepare your values file

Create a file named `my-values.yaml`:

```yaml
# Image configuration
image:
    repository: marmos91c/cubbit-slideshow-demo
    tag: 'latest'

# Ingress configuration
ingress:
    enabled: true
    className: 'nginx'
    hosts:
        - host: slideshow.example.com # <-- Change to your domain
          paths:
              - path: /
                pathType: Prefix
    tls:
        - secretName: slideshow-tls
          hosts:
              - slideshow.example.com # <-- Change to your domain

# S3 configuration
cubbit:
    # Public settings
    S3_BUCKET_NAME: 'your-bucket-name' # <-- Change this
    MAX_FILE_SIZE: '10485760'
    SLIDESHOW_SPEED_S: '40'

    # Private settings (will be stored as secrets)
    S3_REGION: 'eu-central-1' # <-- Change if needed
    S3_ACCESS_KEY_ID: 'your-access-key-id' # <-- Required
    S3_SECRET_ACCESS_KEY: 'your-secret-key' # <-- Required
    S3_ENDPOINT: 'https://your-s3-endpoint' # <-- Required
    MULTIPART_THRESHOLD: '5242880'
```

Make sure to replace all the placeholder values with your actual configuration.

### 3. Install the chart

```bash
helm install slideshow ./cubbit-slideshow -f my-values.yaml
```

### 4. Verify the installation

```bash
kubectl get pods
kubectl get ing
```

That's it! Once all pods are ready, you can access:

- Photo upload: <https://your-domain/upload>
- Slideshow view: <https://your-domain/slideshow>

## Customization

### No Ingress? Use port forwarding

If you don't want to use Ingress, set `ingress.enabled: false` and use:

```bash
kubectl port-forward svc/slideshow-cubbit-slideshow 8080:80
```

Then access:

- <http://localhost:8080/upload>
- <http://localhost:8080/slideshow>

### Troubleshooting

Check pod logs:

```bash
kubectl logs deployment/slideshow-cubbit-slideshow
```

## Uninstalling

```bash
helm uninstall slideshow
```
