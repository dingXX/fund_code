/* eslint-disable @typescript-eslint/naming-convention */
import mongoose, { Document, Schema } from 'mongoose';

export interface HadBugFundDot extends Document {
  fundCode: string;
  buyDate: string;
  buyPrice: number;
  buyCount?: number;
  fundPrice?: number;
  sealedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HadBugFundDotSchema: Schema = new Schema(
  {
    fundCode: { type: String, require: true },
    buyDate: { type: String, require: true },
    buyPrice: { type: Number, require: true },
    buyCount: Number,
    fundPrice: Number,
    sealedAt: Date,
    createdAt: { type: Date, default: Date.now() },
    updatedAt: { type: Date, default: Date.now() },
  },
  {
    timestamps: true, // 自动管理 createdAt 和 updatedAt
  },
);

export default mongoose.models['had-bug-fund-dot'] ||
  mongoose.model<HadBugFundDot>('had-bug-fund-dot', HadBugFundDotSchema);
