"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: process.env.FRONTEND_URL || '*' });
    app.setGlobalPrefix('v1', {
        exclude: [{ path: 'health', method: common_1.RequestMethod.GET }],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('FloodWatch API')
        .setVersion('1.0.0')
        .setDescription('Flood Early Warning API System')
        .addBearerAuth()
        .build();
    swagger_1.SwaggerModule.setup('docs', app, swagger_1.SwaggerModule.createDocument(app, config));
    const port = process.env.PORT ?? 8000;
    await app.listen(port);
    console.log(`FloodWatch API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map