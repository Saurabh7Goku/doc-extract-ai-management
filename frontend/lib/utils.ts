export function getApiUrl(path: string): string {
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return `/api/${clean}`;
}

export function getWsUrl(endpoint: string): string {
    const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `/ws/${clean}`;
}