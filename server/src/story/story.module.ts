import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { FileModule } from '../file/file.module';
import { ContentFilterModule } from '../content-filter/content-filter.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
    FileModule,
    ContentFilterModule,
  ],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoryModule {}
