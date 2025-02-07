import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BotDocument = HydratedDocument<Bot>;

@Schema({
  timestamps: true,
})
export class Bot {
  @Prop()
  evmAddress: string; // evm address

  @Prop()
  ckbAddress: string; // ckb address

  @Prop()
  ckbTestAddress: string; // ckb testnet address

  @Prop()
  solAddress: string; // solana address

  @Prop()
  privateKey: string; // encrypt private key，for EVM、CKB

  @Prop()
  solPrivateKey: string; // encrypt private key，for Solana
}

export const BotSchema = SchemaFactory.createForClass(Bot);
