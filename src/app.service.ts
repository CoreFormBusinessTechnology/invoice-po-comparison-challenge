import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);

  public compareInvoiceAndPo(): void {
    this.logger.log('Logging something here');
  }
}
