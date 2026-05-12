import mongoose, { Schema, Types } from "mongoose";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export type TaskDoc = mongoose.Document & {
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date | null;
  projectId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  completedDate?:Date | null;
  
};

const TaskSchema = new Schema<TaskDoc>(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED"],
      default: "TODO",
      required: true,
      index: true,
    },
    dueDate: { type: Date, required: false, index: true },
    completedDate: { type: Date, required: false, index: true },
    projectId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Project" },
  },
  { timestamps: true },
);

export const TaskModel = mongoose.models.Task || mongoose.model<TaskDoc>("Task", TaskSchema);

