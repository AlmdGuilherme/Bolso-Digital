import { App } from "./app.js";
import "dotenv/config";

async function bootstrap() {
  try {
    const port = Number(process.env.PORT) || 3000;

    const app = new App();
    const server = app.getInstance();

    await server.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`Servidor rodando na porta ${port}`);
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

bootstrap();