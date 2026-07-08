import { Body, Controller, Get, NotFoundException, Post, Query, Res } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private resolveProjectFile(fileName: string) {
    const candidates = [
      resolve(__dirname, '..', '..', '..', fileName),
      resolve(__dirname, '..', '..', fileName),
      resolve(__dirname, '..', fileName),
      resolve(process.cwd(), fileName),
      resolve(process.cwd(), '..', fileName),
      resolve(process.cwd(), '..', '..', fileName),
    ];

    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }

  @Get()
  root(@Res({ passthrough: true }) reply: any) {
    const indexPath = this.resolveProjectFile('index.html');

    if (!indexPath) {
      throw new NotFoundException();
    }

    reply.type('text/html; charset=utf-8');
    return reply.send(readFileSync(indexPath, 'utf8'));
  }

  @Get('widget.js')
  widgetScript(@Res({ passthrough: true }) reply: any) {
    const widgetPath = this.resolveProjectFile('widget.js');

    if (!widgetPath) {
      throw new NotFoundException();
    }

    reply
      .header('Content-Type', 'application/javascript; charset=utf-8')
      .header('Cache-Control', 'public, max-age=3600');
    return reply.send(readFileSync(widgetPath, 'utf8'));
  }

  @Get('api/health')
  async health() {
    return this.appService.getHealth();
  }

  @Get('api/faqs')
  async getFaqs() {
    return this.appService.getFaqs();
  }

  @Get('api/chat')
  async chat(@Query('q') q: string) {
    return this.appService.chat(q);
  }

  @Post('api/pertanyaan-lainnya')
  async submitQuestion(@Body('question') question: string) {
    return this.appService.submitQuestion(question);
  }
}
