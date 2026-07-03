"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path_1 = require("path");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const static_1 = __importDefault(require("@fastify/static"));
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter(), {
        logger: ['log', 'error', 'warn'],
    });
    app.register(static_1.default, {
        root: (0, path_1.join)(__dirname, '..'),
        prefix: '/static/',
        wildcard: false,
    });
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port, '0.0.0.0');
    const url = await app.getUrl();
    console.log(`Server lokal berjalan di: ${url}`);
}
bootstrap();
//# sourceMappingURL=main.js.map