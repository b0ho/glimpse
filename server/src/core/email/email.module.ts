import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

/**
 * 이메일 모듈
 *
 * 이메일 발송 기능을 제공합니다.
 * Global 모듈로 설정되어 한 번 import하면 모든 모듈에서 사용 가능합니다.
 */
@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const provider = configService.get('EMAIL_PROVIDER', 'smtp');

        switch (provider) {
          case 'smtp':
            return {
              transport: {
                host: configService.get('SMTP_HOST', 'smtp.gmail.com'),
                port: configService.get<number>('SMTP_PORT', 587),
                secure: configService.get('SMTP_SECURE') === 'true',
                auth: {
                  user: configService.get('SMTP_USER'),
                  pass: configService.get('SMTP_PASSWORD'),
                },
              },
              defaults: {
                from: configService.get('SMTP_FROM', 'noreply@glimpse.app'),
              },
            };

          default:
            // Development mode - console transport
            return {
              transport: {
                streamTransport: true,
                newline: 'unix',
                buffer: true,
              },
            };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
