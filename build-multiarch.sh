#!/bin/bash
set -euo pipefail

IMAGE_NAME="cubbit/slideshow"
VERSION="latest"
NODE_VERSION="20"
PUSH=false

while getopts "v:n:p" opt; do
    case $opt in
        v) VERSION="$OPTARG" ;;
        n) NODE_VERSION="$OPTARG" ;;
        p) PUSH=true ;;
        *) echo "Usage: $0 [-v version] [-n node_version] [-p push]"; exit 1 ;;
    esac
done

echo "Building ${IMAGE_NAME}:${VERSION} (Node ${NODE_VERSION})"

# Ensure buildx builder exists
docker buildx inspect mybuilder > /dev/null 2>&1 || \
    docker buildx create --name mybuilder --use

docker buildx use mybuilder

build_args=(
    --platform linux/amd64,linux/arm64
    --build-arg "NODE_VERSION=${NODE_VERSION}"
    -t "${IMAGE_NAME}:${VERSION}"
    -f Dockerfile
)

if [ "$VERSION" != "latest" ]; then
    build_args+=(-t "${IMAGE_NAME}:latest")
fi

if [ "$PUSH" = true ]; then
    build_args+=(--push)
else
    # Multi-arch requires --push; fall back to local single-arch build
    local_platform="linux/$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')"
    build_args=(--platform "$local_platform" --build-arg "NODE_VERSION=${NODE_VERSION}" -t "${IMAGE_NAME}:${VERSION}" -f Dockerfile --load)
    if [ "$VERSION" != "latest" ]; then
        build_args+=(-t "${IMAGE_NAME}:latest")
    fi
fi

docker buildx build "${build_args[@]}" .

echo "Done: ${IMAGE_NAME}:${VERSION}"
