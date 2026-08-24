import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskSubtask {
  title: string;
  done: boolean;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ITask extends Document {
  projectId: mongoose.Types.ObjectId;
  sprintId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'task' | 'bug' | 'issue' | 'feature';
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  labels: string[];
  subtasks: ITaskSubtask[];
  parentTask?: mongoose.Types.ObjectId;
  comments: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ITaskSubtask>({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint' },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ['task', 'bug', 'issue', 'feature'], default: 'task' },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done', 'cancelled'],
      default: 'todo',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    estimatedHours: { type: Number },
    actualHours: { type: Number },
    dueDate: { type: Date },
    labels: [{ type: String, trim: true }],
    subtasks: [subtaskSchema],
    parentTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    comments: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ sprintId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ parentTask: 1 });

export default mongoose.model<ITask>('Task', taskSchema);
