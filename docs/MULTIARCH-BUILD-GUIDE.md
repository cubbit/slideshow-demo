# Multi-Architecture Docker Build Guide

This guide explains how to build Docker images for multiple CPU architectures (amd64/x86_64 and arm64/aarch64) for the Cubbit Slideshow Demo application. Multi-architecture images allow your application to run natively on various platforms including:

- Standard x86_64 servers and desktops
- ARM-based devices like Raspberry Pi
- AWS Graviton instances
- Apple Silicon Macs

## Prerequisites

- Docker 19.03 or newer with buildx support
- Docker Hub account (or other container registry) if you want to push your images
- Node.js and npm (to use the npm scripts)

## Build Options

The application includes a build script that can be run directly or through npm:

### Using npm (Recommended)

```bash
# Basic build (local only)
npm run docker:build

# Build with a specific version tag
npm run docker:build -- -v 1.0.0

# Build with a specific Node.js version
npm run docker:build -- -n 20

# Build and push to Docker Hub
npm run docker:build -- -v 1.0.0 -n 20 -p
```

### Using the Script Directly

```bash
# Make the script executable
chmod +x build-multiarch.sh

# Basic build
./build-multiarch.sh

# Build with options
./build-multiarch.sh -v 1.0.0 -n 20 -p
```

## Available Options

The build script supports the following options:

```
Usage: ./build-multiarch.sh [-v version] [-n node_version] [-p]
  -v version      : Tag version (default: latest)
  -n node_version : Node.js version to use (default: 18)
  -p              : Push to registry after build
  -h              : Show this help message
```

## How It Works

1. The build script sets up a Docker Buildx builder instance.
2. It configures the build to target both amd64 and arm64 platforms.
3. The build uses a specialized `Dockerfile.multiarch` that includes platform-specific flags.
4. The Node.js version is parameterized and can be specified at build time.
5. When using the `--push` option, Docker pushes all architecture variants to the registry with proper manifests.

## Technical Details

### Dockerfile.multiarch

The `Dockerfile.multiarch` is designed specifically for multi-architecture builds. It:

1. Uses a multi-stage build process to minimize image size
2. Properly sets up cross-compilation flags
3. Uses the Alpine Linux base image for smaller footprint
4. Includes Tini as an init process for proper signal handling
5. Sets up proper user permissions for security

### Build Process

1. The script creates or uses a Buildx builder instance
2. It configures platform targets (amd64 and arm64)
3. It passes build arguments for versions and architecture
4. It builds the image and optionally pushes to a registry

## Verifying Multi-Architecture Support

After pushing your image to a registry, you can verify the supported architectures:

```bash
docker buildx imagetools inspect cubbit/slideshow-demo:latest
```

You should see information about both AMD64 and ARM64 variants.

## Using in Kubernetes

Once you've pushed a multi-architecture image, Kubernetes will automatically pull the correct architecture variant based on the node's CPU architecture. No special configuration is needed in your Helm charts or deployment files.

## Troubleshooting

### Common Issues

1. **"buildx not found"**: Make sure you have Docker 19.03+ and buildx plugin installed.

2. **"unknown flag: --platform"**: Your Docker version might be too old. Update to a newer version.

3. **"failed to solve with frontend dockerfile.v0"**: May indicate an issue with your Docker daemon's emulation setup. Try:

    ```bash
    docker run --privileged --rm tonistiigi/binfmt --install all
    ```

4. **Slow builds for non-native architecture**: This is normal - emulation is slower than native building.

5. **Authentication errors when pushing**: Make sure you're logged in to your Docker registry:

    ```bash
    docker login
    ```

6. **"exec /sbin/tini: not found"**: If you see this error when running the container, it means tini wasn't installed properly during the build. Try building the image again.

## Performance Notes

- Building for multiple architectures takes longer than a regular build
- If you're building on a non-arm64 machine (like a typical x86 PC), the ARM builds will use QEMU emulation which is significantly slower
- For the fastest builds, use a native build farm with both amd64 and arm64 machines

## Best Practices

1. **Use the default Node.js LTS version** unless you specifically need a newer version
2. **Tag your images semantically** (e.g., 1.0.0, 1.0.1) instead of using "latest" for production
3. **Always test images locally** before pushing to a registry
4. **Consider using CI/CD pipelines** for automated builds across architectures
