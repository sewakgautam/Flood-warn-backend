"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const worker_module_1 = require("./worker.module");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(worker_module_1.WorkerAppModule);
    console.log('[Worker] FloodWatch background workers started');
    process.on('SIGTERM', () => app.close());
}
bootstrap().catch((err) => {
    console.error('Worker fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map