"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const app_service_1 = require("./app.service");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    resolveProjectFile(fileName) {
        const candidates = [
            (0, path_1.resolve)(__dirname, '..', '..', '..', fileName),
            (0, path_1.resolve)(__dirname, '..', '..', fileName),
            (0, path_1.resolve)(__dirname, '..', fileName),
            (0, path_1.resolve)(process.cwd(), fileName),
            (0, path_1.resolve)(process.cwd(), '..', fileName),
            (0, path_1.resolve)(process.cwd(), '..', '..', fileName),
        ];
        return candidates.find((candidate) => (0, fs_1.existsSync)(candidate)) ?? null;
    }
    root(reply) {
        const indexPath = this.resolveProjectFile('index.html');
        if (!indexPath) {
            throw new common_1.NotFoundException();
        }
        reply.type('text/html; charset=utf-8');
        return reply.send((0, fs_1.readFileSync)(indexPath, 'utf8'));
    }
    widgetScript(reply) {
        const widgetPath = this.resolveProjectFile('widget.js');
        if (!widgetPath) {
            throw new common_1.NotFoundException();
        }
        reply
            .header('Content-Type', 'application/javascript; charset=utf-8')
            .header('Cache-Control', 'public, max-age=3600');
        return reply.send((0, fs_1.readFileSync)(widgetPath, 'utf8'));
    }
    async health() {
        return this.appService.getHealth();
    }
    async getFaqs() {
        return this.appService.getFaqs();
    }
    async chat(q) {
        return this.appService.chat(q);
    }
    async submitQuestion(question) {
        return this.appService.submitQuestion(question);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "root", null);
__decorate([
    (0, common_1.Get)('widget.js'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "widgetScript", null);
__decorate([
    (0, common_1.Get)('api/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('api/faqs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getFaqs", null);
__decorate([
    (0, common_1.Get)('api/chat'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "chat", null);
__decorate([
    (0, common_1.Post)('api/pertanyaan-lainnya'),
    __param(0, (0, common_1.Body)('question')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "submitQuestion", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map