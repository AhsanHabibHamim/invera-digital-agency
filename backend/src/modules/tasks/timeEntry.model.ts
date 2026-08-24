import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeEntry extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  description?: string;
  hours: number;
  date: Date;
  billable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    description: { type: String, trim: true },
    hours: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    billable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timeEntrySchema.index({ taskId: 1 });
timeEntrySchema.index({ userId: 1, date: -1 });
timeEntrySchema.index({ projectId: 1 });

export default mongoose.model<ITimeEntry>('TimeEntry', timeEntrySchema);
