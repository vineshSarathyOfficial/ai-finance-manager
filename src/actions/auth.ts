"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { seedDefaultCategories } from "@/lib/db/seed-categories";

type AuthFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function registerUser(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Seed default categories for new user
  try {
    await seedDefaultCategories(user.id);
  } catch {
    // Non-fatal: user can still use the app
  }

  // Auto sign-in after registration
  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  redirect("/dashboard");
}

export async function loginUser(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "Invalid email or password." };
        default:
          return { message: "Something went wrong. Please try again." };
      }
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}

