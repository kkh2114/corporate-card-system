import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*', credentials: true },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`user:${payload.sub}`);

      if (['admin', 'finance', 'manager'].includes(payload.role)) {
        client.join('admin-channel');
      }

      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data?.userId}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channels: string[] },
  ) {
    data.channels.forEach((channel) => client.join(channel));
    return { event: 'subscribed', data: { channels: data.channels } };
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Emit to admin channel
  emitToAdmins(event: string, data: any) {
    this.server.to('admin-channel').emit(event, data);
  }

  // Emit transaction events
  emitTransactionNew(data: any) {
    this.emitToAdmins('transaction:new', data);
  }

  emitTransactionStatus(userId: string, data: any) {
    this.emitToUser(userId, 'transaction:status', data);
  }

  emitAlert(data: any) {
    this.emitToAdmins('alert:new', data);
  }
}
