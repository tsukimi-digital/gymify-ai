import { Response } from 'express';

export function initSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

export function sendSSEEvent(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function sendSSEPing(res: Response) {
  res.write(':ping\n\n');
}
