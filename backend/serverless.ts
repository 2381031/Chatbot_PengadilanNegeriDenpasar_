import type { FastifyInstance } from 'fastify';
import { createApp } from './src/main';

let serverPromise: Promise<any> | null = null;

async function getFastifyInstance(): Promise<any> {
  if (!serverPromise) {
    serverPromise = createApp()
        .then(async app => {
        await app.init();
        const fastify = app.getHttpAdapter().getInstance();
        await fastify.ready();
        return fastify;
      })
      .catch(error => {
        serverPromise = null;
        throw error;
      });
  }

  return serverPromise;
}

export default async function handler(req: any, res: any) {
  const fastify = await getFastifyInstance();
  fastify.server.emit('request', req, res);
}
