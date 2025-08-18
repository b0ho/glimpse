import { INestApplication } from '@nestjs/common';

declare global {
  var nestApp: INestApplication | undefined;
}

export {};