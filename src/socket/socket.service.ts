import { Global, Injectable, OnModuleInit } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { ConfigService } from '@nestjs/config';
import { BaseRequest, TxRequest } from '../types';
import { Subject } from 'rxjs';
import { decryptMsg, encryptMsg, safeJsonParse } from '../crypto';

enum SocketEvent {
  SaveNodeMessage = 'save_node_msg',
  SignTx = 'sign_tx',
  CreateBot = 'create_bot',
}

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

  onReceiveTx(callback: (data: TxRequest) => Promise<string | undefined>) {
    this.socket.off(SocketEvent.SignTx);
    this.socket.on(SocketEvent.SignTx, async ({ uid, data }: BaseRequest) => {
      if (!data) {
        return;
      }
      try {
        const msg = this.decryptData(data);
        const txData = safeJsonParse(msg.data) as TxRequest;
        const signedTx = await callback({
          ...txData,
          uid,
        });
        if (!signedTx) {
          return;
        }
        const encryptData = JSON.stringify(
          this.encryptData(JSON.stringify({ signedTx })),
        );
        this.socket.emit(SocketEvent.SaveNodeMessage, {
          uid,
          data: encryptData,
        });
      } catch (e) {
        console.error(e);
      }
    });
  }

  private getTokenAndAesKey() {
    const aesKey = this.configService.get<string>('aesKey')!;
    const token = this.configService.get<string>('token')!;
    return {
      aesKey,
      token,
    };
  }

  private decryptData(encryptedData: string) {
    const { aesKey, token } = this.getTokenAndAesKey();
    return decryptMsg(token, aesKey, encryptedData);
  }

  private encryptData(plaintext: string) {
    const { aesKey, token } = this.getTokenAndAesKey();
    return encryptMsg(token, aesKey, plaintext);
  }

  onReceiveCreateBot(callback: () => Promise<Record<string, string>>) {
    this.socket.off(SocketEvent.CreateBot);
    this.socket.on(SocketEvent.CreateBot, async ({ uid }: BaseRequest) => {
      const bot = await callback();
      const data = JSON.stringify(this.encryptData(JSON.stringify(bot)));
      this.socket.emit(SocketEvent.SaveNodeMessage, {
        uid,
        data,
      });
    });
  }
}
