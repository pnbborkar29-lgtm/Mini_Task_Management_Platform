import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { signAccessToken } from "../lib/auth";
import { validate } from "../lib/validate";
import { UserModel } from "../models/User";

export const authRouter = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

authRouter.post("/signup", validate({ body: SignupSchema }), async (req, res) => {
  const { email, password, name } = req.body as z.infer<typeof SignupSchema>;

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) throw new ApiError(409, "EMAIL_IN_USE", "Email is already in use");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ email, name, passwordHash });

  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  res.status(201).json({
    ok: true,
    data: {
      user: { id: user._id.toString(), email: user.email, name: user.name ?? null, createdAt: user.createdAt },
      token,
    },
  });
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", validate({ body: LoginSchema }), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof LoginSchema>;

  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  res.json({
    ok: true,
    data: { user: { id: user._id.toString(), email: user.email, name: user.name ?? null }, token },
  });
});

