import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';

/**
 * WebSocket 인증 가드
 *
 * Socket.IO 연결에 대한 JWT 토큰 검증을 수행합니다.
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromSocket(client);

      if (!token) {
        throw new WsException('인증 토큰이 필요합니다.');
      }

      const payload = await this.authService.verifyToken(token);

      if (!payload) {
        throw new WsException('유효하지 않은 토큰입니다.');
      }

      // Clerk token verification
      if (payload.sub) {
        const user = await this.authService.findUserByClerkId(payload.sub);

        if (!user) {
          // Create user if not exists
          const newUser = await this.authService.createOrUpdateUser(
            payload.sub,
          );
          client.data.user = newUser;
        } else {
          client.data.user = user;

          // Update last active
          await this.authService.updateLastActive(user.id);
        }
      }
      // Legacy JWT token
      else if (payload.userId) {
        const user = await this.authService.findUserByClerkId(payload.userId);
        client.data.user = user;

        if (user) {
          await this.authService.updateLastActive(user.id);
        }
      } else {
        throw new WsException('유효하지 않은 토큰 형식입니다.');
      }

      return true;
    } catch (error) {
      throw new WsException('토큰 검증에 실패했습니다.');
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      return type === 'Bearer' ? token : undefined;
    }

    // Query parameter fallback for WebSocket
    const token = client.handshake.query.token;
    return Array.isArray(token) ? token[0] : token;
  }
}
