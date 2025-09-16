/* eslint-disable @typescript-eslint/naming-convention */
import mongoose, { Document, Schema } from 'mongoose';
import { CanSealItem } from '../types/fund';

export interface SealMsgRecord extends Document {
  canSealItemList: CanSealItem[];
  hadSeal?: boolean;
  nowDate: string;
}

const SealMsgRecordSchema: Schema = new Schema(
  {
    canSealItemList: [
      {
        sealDotLen: String,
        sealPrice: String,
        buyPrice: String,
        sealIncome: String,
        sealIncomeRate: String,
        sealCountRate: String,
        changeRate: Number,
        buyTime: String,
        fundCode: String,
        needSealIds: [String],
      },
    ],

    hadSeal: Boolean,

    nowDate: String,
    createdAt: { type: Date, default: Date.now() },
    updatedAt: { type: Date, default: Date.now() },
  },
  {
    timestamps: true, // 自动管理 createdAt 和 updatedAt
  },
);

export default mongoose.models.SealMsgRecord ||
  mongoose.model<SealMsgRecord>('seal-msg-record', SealMsgRecordSchema);
