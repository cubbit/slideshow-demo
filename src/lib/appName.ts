const DEFAULT_APP_NAME = 'Slideshow';

export function getAppName(): string {
    return process.env.APP_NAME || DEFAULT_APP_NAME;
}

export function getAppTitle(): string {
    return `Cubbit ${getAppName()}`;
}
