import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { Hex } from 'viem';
import { config, hd, Script } from '@ckb-lumos/lumos';
import { encodeToAddress } from '@ckb-lumos/lumos/helpers';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { ConfigService } from '@nestjs/config';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { InjectModel } from '@nestjs/mongoose';
import { Bot, BotDocument } from './schemas/bot.schema';
import { Model } from 'mongoose';
import { SocketService } from '../socket/socket.service';

@Injectable()
export class BotService {
  constructor(
    private readonly configService: ConfigService,
    private readonly socketService: SocketService,
    @InjectModel(Bot.name) private botModel: Model<BotDocument>,
  ) {}

  private genCkbAddress(privateKey: Hex) {
    const pubKeyHash = hd.key.privateKeyToBlake160(privateKey);
    const {
      AGGRON4, // testnet
      LINA, // mainnet
    } = config.predefined;
    const omniLockTestet: Script = {
      codeHash: AGGRON4.SCRIPTS.OMNILOCK.CODE_HASH,
      hashType: AGGRON4.SCRIPTS.OMNILOCK.HASH_TYPE,
      args: `0x00${pubKeyHash.substring(2)}00`,
    };
    const omniLockMainnet: Script = {
      codeHash: LINA.SCRIPTS.OMNILOCK.CODE_HASH,
      hashType: LINA.SCRIPTS.OMNILOCK.HASH_TYPE,
      args: `0x00${pubKeyHash.substring(2)}00`,
    };
    return {
      ckbAddress: encodeToAddress(omniLockMainnet, { config: LINA }),
      ckbTestAddress: encodeToAddress(omniLockTestet, { config: AGGRON4 }),
    };
  }

  private encryptPrivateKey(privateKey: string) {
    const secret = this.configService.get<string>('password')!;
    const key = Buffer.from(secret, 'utf8');
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    let encryptedData = cipher.update(privateKey, 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    return encryptedData;
  }

  private decryptPrivateKey(encryptedPrivateKey: string): Hex {
    const secret = this.configService.get<string>('password')!;
    const key = Buffer.from(secret, 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    let decryptedData = decipher.update(encryptedPrivateKey, 'base64', 'utf8');
    decryptedData += decipher.final('utf8');
    return decryptedData as Hex;
  }

  async addBot() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const evmAddress = account.address;
    const encryptedPrivateKey = this.encryptPrivateKey(privateKey);
    const { ckbAddress, ckbTestAddress } = this.genCkbAddress(privateKey);
    const solAccount = Keypair.generate();
    const solAddress = solAccount.publicKey.toBase58();
    const encryptedSolPrivateKey = this.encryptPrivateKey(
      bs58.encode(solAccount.secretKey),
    );
    await this.botModel.create({
      evmAddress,
      ckbAddress,
      ckbTestAddress,
      solAddress,
      privateKey: encryptedPrivateKey,
      solPrivateKey: encryptedSolPrivateKey,
    });
    return {
      evmAddress,
      ckbAddress,
      ckbTestAddress,
      solAddress,
    };
  }
}
