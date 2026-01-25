"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { TimeScheduleIcon } from "@hugeicons/core-free-icons";
import { useForm } from "react-hook-form";

import type { ResetPasswordFormData } from "@turbo/validators";
import { cn } from "@turbo/ui";
import { Button } from "@turbo/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@turbo/ui/field";
import { Icon } from "@turbo/ui/icon";
import { Input } from "@turbo/ui/input";
import { toast } from "@turbo/ui/toast";
import { resetPasswordSchema } from "@turbo/validators";

export const ResetPasswordForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const otp = searchParams.get("otp") ?? "";
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email || !otp) {
      toast.error("Missing email or verification code. Please start over.");
      return;
    }

    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password: data.password,
    });

    if (error) {
      toast.error(error.message ?? "Failed to reset password");
      return;
    }

    toast.success("Password reset successfully!");
    router.push("/login");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <Icon icon={TimeScheduleIcon} className="size-6" />
              </div>
              <span className="sr-only">Turbo</span>
            </Link>
            <h1 className="text-xl font-bold">Set new password</h1>
            <FieldDescription>Enter your new password below.</FieldDescription>
          </div>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">New Password</FieldLabel>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </Field>

          <Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="size-4"
              />
              Show passwords
            </label>
          </Field>

          <Field>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Reset Password
            </Button>
          </Field>

          <FieldDescription className="text-center">
            Remember your password?{" "}
            <Link href="/login" className="text-primary underline">
              Back to login
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
};
