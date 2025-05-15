# Cubbit Slideshow Demo Helm Chart

A simple Helm chart for deploying the Cubbit Slideshow Demo application on Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- A Cubbit DS3 bucket with proper credentials
- (Optional) TLS certificate for Ingress SSL

## Quick Start

1. Edit the `values.yaml` file to include your S3 credentials and configuration
2. Install the chart:

```bash
helm install slideshow ./cubbit-slideshow
```

## Configuration

Key parameters you'll want to customize:

### S3 Configuration

```yaml
cubbit:
    S3_BUCKET_NAME: 'cubbit-slideshow'
    MAX_FILE_SIZE: '10485760' # 10MB in bytes
    SLIDESHOW_SPEED_S: '40' # Speed of slideshow in seconds

    # These will be stored in a Secret
    S3_REGION: 'eu-central-1'
    S3_ACCESS_KEY_ID: 'your-access-key'
    S3_SECRET_ACCESS_KEY: 'your-secret-key'
    S3_ENDPOINT: 'https://your-s3-endpoint'
    MULTIPART_THRESHOLD: '5242880' # 5MB in bytes
```

### Verbose Logging

You can enable verbose Next.js server logs:

```yaml
# Enable verbose logging
verbose: true
```

When enabled, this:

- Sets `DEBUG="next:*,http"` to show detailed Next.js framework logs
- Sets `NODE_OPTIONS="--trace-warnings --trace-deprecation"` to show more detailed Node.js warnings
- Makes server logs much more detailed for debugging purposes

### Ingress Configuration

The chart is set up to use nginx ingress with SSL by default:

```yaml
ingress:
    enabled: true
    className: 'nginx'
    annotations:
        kubernetes.io/ingress.class: nginx
    hosts:
        - host: slideshow.example.com
          paths:
              - path: /
                pathType: Prefix
    tls:
        - secretName: slideshow-tls # Your existing TLS certificate secret
          hosts:
              - slideshow.example.com
```

### Using Existing TLS Certificate

Make sure your TLS certificate is already created in the same namespace. If you've used certbot, you might need to create a Kubernetes Secret from your certificate files:

```bash
kubectl create secret tls slideshow-tls --key /path/to/privkey.pem --cert /path/to/fullchain.pem
```

Then reference this secret in your values file.

## Accessing the Application

The Cubbit Slideshow Demo has two main endpoints:

- `/upload` - Use this to upload photos
- `/slideshow` - View the slideshow of today's photos

## Uninstallation

```bash
helm uninstall slideshow
```

## About Cubbit Slideshow Demo

The Cubbit Slideshow Demo is a Next.js application demonstrating file upload and slideshow capabilities using Cubbit DS3 storage. For more information, visit the [GitHub repository](https://github.com/marmos91/cubbit-slideshow-demo).com

````

### Using Existing TLS Certificate

Make sure your TLS certificate is already created in the same namespace. If you've used certbot, you might need to create a Kubernetes Secret from your certificate files:

```bash
kubectl create secret tls slideshow-tls --key /path/to/privkey.pem --cert /path/to/fullchain.pem
````

Then reference this secret in your values file.

## Accessing the Application

The Cubbit Slideshow Demo has two main endpoints:

- `/upload` - Use this to upload photos
- `/slideshow` - View the slideshow of today's photos

## Uninstallation

```bash
helm uninstall slideshow
```

## About Cubbit Slideshow Demo

The Cubbit Slideshow Demo is a Next.js application demonstrating file upload and slideshow capabilities using Cubbit DS3 storage. For more information, visit the [GitHub repository](https://github.com/marmos91/cubbit-slideshow-demo).
