import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotService } from './bot/bot.service';
import { SocketService } from './socket/socket.service';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly socketService: SocketService,
    private readonly botService: BotService,
  ) {}

  main() {
    this.socketService.onConnection$.subscribe(() => {
      this.socketService.onReceiveCreateBot(() => this.botService.addBot());
      this.socketService.onReceiveTx(
        async (data) => await this.botService.signTx(data),
      );
      this.socketService.onReceiveConnectTest();
    });
  }

  getUnixNow(): number {
    return Math.floor(Date.now() / 1000);
  }
}
