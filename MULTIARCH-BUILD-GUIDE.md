# Building Multi-Architecture Docker Images for Cubbit Slideshow Demo

This guide explains how to build Docker images for multiple CPU architectures (amd64/x86_64 and arm64/aarch64) using Docker Buildx. This allows your application to run natively on various platforms including:

- Standard x86 servers and desktops
- ARM-based systems like Raspberry Pi
- AWS Graviton instances
- Apple Silicon Macs

## Prerequisites

- Docker 19.03 or newer with buildx support
- Docker Hub account (or other container registry)

## Setup Instructions

### 1. Prepare the Dockerfile

I've created a specialized `Dockerfile.multiarch` with the necessary platform support. This file is similar to your original Dockerfile but includes special flags for multi-architecture builds.

### 2. Make the Build Script Executable

```bash
chmod +x build-multiarch.sh
```

### 3. Build the Multi-Architecture Image

#### Basic build (local only)

This will build the image for both amd64 and arm64 architectures but won't push to any registry:

```bash
./build-multiarch.sh
```

#### Build with a specific version tag

```bash
./build-multiarch.sh -v 1.0.0
```

#### Build with a specific Node.js version

```bash
./build-multiarch.sh -n 20
```

#### Build and push to Docker Hub

```bash
./build-multiarch.sh -v 1.0.0 -n 20 -p
```

This will build and push images with tags:

- `marmos91c/cubbit-slideshow-demo:1.0.0`
- `marmos91c/cubbit-slideshow-demo:latest`

### 4. Available Options

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
3. The Dockerfile uses build arguments and platform-specific settings to ensure compatibility.
4. The Node.js version is parameterized and can be specified at build time.
5. When using the `--push` option, Docker pushes all architecture variants to the registry with proper manifests.

## Important Notes

- Building for multiple architectures takes longer than a regular build
- You need to be logged in to your Docker registry (`docker login`) before pushing
- If you're building on a non-arm64 machine (like a typical x86 PC), the ARM builds will use QEMU emulation which is slower
- You can customize the targeted platforms by modifying the `PLATFORMS` variable in the script
- The Dockerfile uses Tini to properly handle signals (like CTRL+C), ensuring graceful container shutdowns

## Verifying Multi-Architecture Support

After pushing your image to a registry, you can verify the supported architectures:

```bash
docker buildx imagetools inspect marmos91c/cubbit-slideshow-demo:latest
```

## Using in Your Helm Chart

Your Helm chart already references the image. Once you've pushed the multi-architecture image, Kubernetes will automatically pull the correct architecture variant based on the node's CPU architecture.

## Troubleshooting

### Common Issues

1. **"buildx not found"**: Make sure you have Docker 19.03+ and buildx plugin installed.

2. **"unknown flag: --platform"**: Your Docker version might be too old. Update to a newer version.

3. **"failed to solve with frontend dockerfile.v0"**: May indicate an issue with your Docker daemon's emulation setup. Try:

    ```bash
    docker run --privileged --rm tonistiigi/binfmt --install all
    ```

4. **Slow builds for non-native architecture**: This is normal - emulation is slower than native building.

5. **"exec /sbin/tini: not found"**: If you see this error when running the container, it means tini wasn't installed properly during the build. Try building the image again.

6. **CTRL+C not working properly**: Make sure your container is using the image with Tini properly installed. If using Docker Compose, you may also add `init: true` to enable Docker's built-in init system as a fallback.
