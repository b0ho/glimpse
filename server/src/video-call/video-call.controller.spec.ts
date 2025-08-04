import { Test, TestingModule } from '@nestjs/testing';
import { VideoCallController } from './video-call.controller';

describe('VideoCallController', () => {
  let controller: VideoCallController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoCallController],
    }).compile();

    controller = module.get<VideoCallController>(VideoCallController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
