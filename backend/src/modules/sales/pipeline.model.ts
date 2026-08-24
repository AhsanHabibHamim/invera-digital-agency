import mongoose, { Schema, Document } from 'mongoose';

export interface IPipelineStage {
  name: string;
  order: number;
  color?: string;
}

export interface ISalesPipeline extends Document {
  name: string;
  stages: IPipelineStage[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pipelineStageSchema = new Schema<IPipelineStage>({
  name: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
  color: { type: String },
}, { _id: true });

const salesPipelineSchema = new Schema<ISalesPipeline>(
  {
    name: { type: String, required: true, trim: true },
    stages: [pipelineStageSchema],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISalesPipeline>('SalesPipeline', salesPipelineSchema);
