import { Global, Injectable, OnModuleInit } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { ConfigService } from '@nestjs/config';
import { BaseRequest, EncryptedMsg } from '../types';
import { Subject } from 'rxjs';

@Global()
@Injectable()
export class SocketService implements OnModuleInit {
  private socket: Socket;
  private connectionSubject = new Subject<void>();
  onConnection$ = this.connectionSubject.asObservable();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const wsConfig = this.configService.get<string>('wssUrl');
    if (!wsConfig) {
      console.error('Invalid wsConfig');
      return;
    }
    const [wsUrl, token] = wsConfig.split('/tx/');
    if (!wsUrl || !token) {
      console.error('Invalid wsUrl');
      return;
    }

    this.socket = io(wsUrl + '/tx', {
      reconnectionDelayMax: 1500,
      autoConnect: true,
      reconnection: true,
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connectionSubject.next();
    });

    this.socket.on('reconnect', () => {
      console.log('Reconnect to server');
    });

    this.socket.on('message', (data) => {
      console.log('Received message:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  onReceiveTx(callback: (data: EncryptedMsg) => void) {
    this.socket.off('tx');
    this.socket.on('tx', callback);
  }

  onReceiveCreateBot(callback: () => Promise<Record<string, string>>) {
    this.socket.off('create_bot');
    this.socket.on('create_bot', async ({ uid }: BaseRequest) => {
      const bot = await callback();
      this.socket.emit('after_create_bot', {
        uid,
        data: JSON.stringify(bot),
      });
    });
  }
}
