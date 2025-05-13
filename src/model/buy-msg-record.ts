/* eslint-disable @typescript-eslint/naming-convention */
import mongoose, { Document, Schema } from 'mongoose';
import { hadBuyParams as HadBuyParams } from '../types/fund';

export interface BuyMsgRecord extends Document {
  needBuyList: HadBuyParams[];
  hadBuy?: boolean;
  nowDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const BuyMsgRecordSchema: Schema = new Schema(
  {
    needBuyList: {
      type: [
        {
          fundCode: String,
          buyDate: String,
          buyPrice: Number,
        },
      ],
      required: true,
    },
    hadBuy: { type: Boolean, required: true },
    nowDate: { type: String },
    createdAt: { type: Date, default: Date.now() },
    updatedAt: { type: Date, default: Date.now() },
  },
  {
    timestamps: true, // 自动管理 createdAt 和 updatedAt
  },
);

export default mongoose.models['buy-msg-record'] ||
  mongoose.model<BuyMsgRecord>('buy-msg-record', BuyMsgRecordSchema);
