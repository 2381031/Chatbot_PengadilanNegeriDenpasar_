import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async health() {
    return this.appService.getHealth();
  }

  @Get('faqs')
  async getFaqs() {
    return this.appService.getFaqs();
  }

  @Get('chat')
  async chat(@Query('q') q: string) {
    return this.appService.chat(q);
  }

  @Post('pertanyaan-lainnya')
  async submitQuestion(@Body('question') question: string) {
    return this.appService.submitQuestion(question);
  }
}
