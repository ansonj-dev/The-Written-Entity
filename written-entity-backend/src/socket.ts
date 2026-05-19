import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { WSMessage } from './types';

let wss: WebSocketServer | undefined;
const clients = new Set<WebSocket>();

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'connected', data: { clientCount: clients.size } }));

    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });
}

export function broadcast(message: WSMessage) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

export function broadcastLog(agent: string, message: string, level: 'info' | 'warn' | 'error' = 'info') {
  broadcast({
    type: 'pipeline:log',
    data: {
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      agent,
      message,
      level,
    },
  });
}
