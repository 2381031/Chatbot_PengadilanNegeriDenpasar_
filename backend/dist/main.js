"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
exports.bootstrap = bootstrap;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function createApp() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter(), {
        logger: ['log', 'error', 'warn'],
    });
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    return app;
}
async function bootstrap() {
    const app = await createApp();
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port, '0.0.0.0');
    const url = await app.getUrl();
    console.log(`Server lokal berjalan di: ${url}`);
}
if (require.main === module) {
    bootstrap();
}
//# sourceMappingURL=main.js.map