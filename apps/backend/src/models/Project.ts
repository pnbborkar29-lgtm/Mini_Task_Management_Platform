import mongoose, { Schema, Types } from "mongoose";

export type ProjectDoc = mongoose.Document & {
  name: string;
  description?: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const ProjectSchema = new Schema<ProjectDoc>(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
  },
  { timestamps: true },
);

export const ProjectModel =
  mongoose.models.Project || mongoose.model<ProjectDoc>("Project", ProjectSchema);

