export function createWebSocket(path = '/ws') {
  // Allow overriding via env for CI/dev proxies: REACT_APP_WS_URL
  const envUrl = process.env.REACT_APP_WS_URL;
  if (envUrl) {
    return new WebSocket(envUrl);
  }

  if (typeof window === 'undefined' || !window.location) {
    throw new Error('createWebSocket must be called in a browser environment');
  }

  const { protocol, hostname, port } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  const host = hostname + (port ? `:${port}` : '');
  const url = `${wsProtocol}//${host}${path}`;
  return new WebSocket(url);
}
