import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppService } from './app.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
