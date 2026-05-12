import mongoose, { Schema } from "mongoose";

export type UserDoc = mongoose.Document & {
  email: string;
  name?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: false },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const UserModel = mongoose.models.User || mongoose.model<UserDoc>("User", UserSchema);

