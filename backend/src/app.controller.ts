import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { join } from 'path';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root(@Res() reply: FastifyReply) {
    return reply.type('text/html').sendFile('index.html', join(__dirname, '..', '..'));
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
