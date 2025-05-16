# Cubbit Slideshow Demo

Show Image

A modern web application for uploading and displaying photos in a beautiful slideshow using Cubbit DS3 or any S3-compatible storage.

## 📸 Features

- **Simple Upload Interface**: Easily upload photos from any device
- **Dynamic Slideshow**: Automatically refreshing slideshow with smooth animations
- **S3 Integration**: Works with Cubbit DS3 or any S3-compatible storage
- **Administrative Settings**: Secure admin panel to configure storage settings
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Kubernetes Deployment**: Ready-to-use Helm chart for easy deployment
- **Multi-Architecture Support**: Docker images available for both amd64 and arm64

## 📷 Screenshots

<!-- Suggested locations for product screenshots: 1. Place screenshots in a 'screenshots' directory at the root of your project 2. Reference them here using relative paths For example: ![Upload Page](screenshots/upload.png) ![Slideshow](screenshots/slideshow.png) ![Settings](screenshots/settings.png) -->

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (or 20+ for optimal performance)
- npm 9+
- S3-compatible storage (Cubbit DS3, AWS S3, MinIO, etc.)

### Development Setup

1. Clone the repository:

    ```bash
    git clone <https://github.com/cubbit/slideshow-demo.git>
    cd slideshow-demo
    ```

    Install dependencies:

    ```bash
    npm install
    ```

2. Create a `.env.local` file with your S3 credentials:

    ```
    # Public settings (available on client)

    NEXT_PUBLIC_S3_BUCKET_NAME=your-bucket-name
    NEXT_PUBLIC_MAX_FILE_SIZE=10485760
    NEXT_PUBLIC_SLIDESHOW_SPEED_S=40
    NEXT_PUBLIC_MIN_COUNT_FOR_MARQUEE=6
    NEXT_PUBLIC_S3_ENDPOINT=<https://your-s3-endpoint>

    # Private settings (server only)

    S3_REGION=eu-central-1
    S3_ACCESS_KEY_ID=your-access-key
    S3_SECRET_ACCESS_KEY=your-secret-key
    MULTIPART_THRESHOLD=5242880

    # Authentication for settings page

    AUTH_USERNAME=admin
    AUTH_PASSWORD=secure-password
    JWT_SECRET=your-random-jwt-secret
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open <http://localhost:3000> in your browser.

## 🐳 Docker Deployment

### Building Docker Images

#### Standard Build

```bash
docker build -t cubbit/slideshow-demo:latest .
```

#### Multi-Architecture Build

The repository includes a script for building multi-architecture images (amd64/arm64):

```bash
# Build image with default settings (Node.js 18, tag: latest)

npm run docker:build

# Build with specific Node.js version and tag

npm run docker:build -- -v 1.2.0 -n 20

# Build and push to registry

npm run docker:build -- -v 1.2.0 -p
```

For more advanced build options, see the [Multi-Architecture Build Guide](docs/MULTIARCH-BUILD-GUIDE.md).

## ☸️ Kubernetes Deployment with Helm

The application can be deployed to Kubernetes using the included Helm chart.

### Quick Start

```bash

# Create your values file

cp helm/values.yaml my-values.yaml

# Edit my-values.yaml with your S3 credentials and settings

nano my-values.yaml

# Install the chart

helm install slideshow ./helm -f my-values.yaml
```

### Advanced Configuration

For complete installation and configuration details, see [Installation Guide](docs/HOW-TO-INSTALL.md).

## ⚙️ Configuration Options

The application can be configured via environment variables or through the settings UI.

Key Configuration Parameters

|       Parameter       |                  Description                  |     Default     |
| :-------------------: | :-------------------------------------------: | :-------------: |
|    S3_BUCKET_NAME     |             Name of the S3 bucket             |    slideshow    |
|     MAX_FILE_SIZE     |       Maximum upload file size (bytes)        | 10485760 (10MB) |
|   SLIDESHOW_SPEED_S   |   Duration of slideshow animation (seconds)   |       40        |
| MIN_COUNT_FOR_MARQUEE | Minimum photos before enabling marquee effect |        6        |
|       S3_REGION       |                   S3 region                   |  eu-central-1   |
|      S3_ENDPOINT      |                S3 endpoint URL                |    Required     |
|   S3_ACCESS_KEY_ID    |                 S3 access key                 |    Required     |
| S3_SECRET_ACCESS_KEY  |                 S3 secret key                 |    Required     |

## Settings UI

Once deployed, you can access the settings page at `/settings` using the credentials defined in your configuration.

## 🔒 Security Considerations

- Change default admin credentials before deployment
- Use HTTPS in production with a valid TLS certificate
- Consider rate limiting and firewall rules for public instances
- Review Kubernetes security best practices if deploying to production clusters

## 🧑‍💻 Development

### Core Technologies

- **Next.js**: React framework with server-side rendering
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **AWS SDK**: For S3 integration
- **Docker/Kubernetes**: For containerization and orchestration

### Project Structure

- `/app`: Next.js application code
- `/public`: Static assets
- `/helm`: Kubernetes Helm chart
- `/app/components`: React components
- `/app/api`: API routes

### Running Tests

```bash
npm test
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
