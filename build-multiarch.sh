#!/bin/bash
set -e

# Configuration
IMAGE_NAME="cubbit/slideshow-demo"
PLATFORMS="linux/amd64,linux/arm64"

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
VERSION="latest"
PUSH=false

print_usage() {
    echo -e "${YELLOW}Usage:${NC} $0 [-v version] [-p]"
    echo -e "  ${BLUE}-v version${NC}  : Tag version (default: latest)"
    echo -e "  ${BLUE}-p${NC}          : Push to registry after build"
    echo -e "  ${BLUE}-h${NC}          : Show this help message"
}

while getopts ":v:ph" opt; do
    case $opt in
    v)
        VERSION="$OPTARG"
        ;;
    p)
        PUSH=true
        ;;
    h)
        print_usage
        exit 0
        ;;
    \?)
        echo -e "${YELLOW}Invalid option: -$OPTARG${NC}" >&2
        print_usage
        exit 1
        ;;
    :)
        echo -e "${YELLOW}Option -$OPTARG requires an argument.${NC}" >&2
        print_usage
        exit 1
        ;;
    esac
done

# Check if Docker and Buildx are available
if ! command -v docker &>/dev/null; then
    echo -e "${YELLOW}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Setup buildx if not already set up
echo -e "${BLUE}Setting up Docker Buildx...${NC}"
docker buildx ls | grep -q mybuilder || docker buildx create --name mybuilder --use

# Build the multi-architecture image
echo -e "${BLUE}Building multi-architecture image for: ${PLATFORMS}${NC}"
echo -e "${BLUE}Image: ${IMAGE_NAME}:${VERSION}${NC}"

BUILD_ARGS="--platform ${PLATFORMS} -t ${IMAGE_NAME}:${VERSION}"

# Add latest tag if version is not latest
if [ "$VERSION" != "latest" ]; then
    BUILD_ARGS="$BUILD_ARGS -t ${IMAGE_NAME}:latest"
fi

# Add --push flag if PUSH is true
if [ "$PUSH" = true ]; then
    echo -e "${BLUE}Will push to registry after build.${NC}"
    BUILD_ARGS="$BUILD_ARGS --push"
else
    echo -e "${BLUE}Will NOT push to registry (use -p to push).${NC}"
    BUILD_ARGS="$BUILD_ARGS --load"
fi

echo -e "${BLUE}Running build...${NC}"
docker buildx build $BUILD_ARGS -f Dockerfile.multiarch .

# Success message
echo -e "${GREEN}Build completed successfully!${NC}"
if [ "$PUSH" = true ]; then
    echo -e "${GREEN}Images have been pushed to the registry.${NC}"
    echo -e "${GREEN}Pull with: docker pull ${IMAGE_NAME}:${VERSION}${NC}"
else
    echo -e "${GREEN}Images are available locally.${NC}"
    echo -e "${GREEN}To push to the registry, run with -p flag: $0 -v ${VERSION} -p${NC}"
fi
