// Vercel serverless function entry point
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

const server = express();

export default async (req: any, res: any) => {
  // Create NestJS app with Express adapter
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { cors: true }
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Initialize the app
  await app.init();

  // Handle the request
  server(req, res);
};