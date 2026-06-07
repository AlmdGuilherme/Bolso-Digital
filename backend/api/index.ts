import { App } from '../src/app';

const application = new App();
const fastify = application.getInstance();

export default async function handler(req: any, res: any) {
  await fastify.ready();

  fastify.server.emit('request', req, res);
}