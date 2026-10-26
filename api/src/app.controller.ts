import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * Indique que l'API répond (utile derrière Nginx et pour la SPA).
   */
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
