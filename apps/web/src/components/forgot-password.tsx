"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { TimeScheduleIcon } from "@hugeicons/core-free-icons";
import { useForm } from "react-hook-form";

import type { ForgotPasswordFormData } from "@turbo/validators";
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
import { forgotPasswordSchema } from "@turbo/validators";

export const ForgotPasswordForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const { error } = await authClient.forgetPassword.emailOtp({
      email: data.email,
    });

    if (error) {
      toast.error(error.message ?? "Failed to send reset code");
      return;
    }

    // Navigate to verify-email page with email and reset type
    router.push(
      `/verify-email?email=${encodeURIComponent(data.email)}&type=forget-password`,
    );
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
            <h1 className="text-xl font-bold">Reset your password</h1>
            <FieldDescription>
              Enter your email address and we&apos;ll send you a verification
              code to reset your password.
            </FieldDescription>
          </div>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Code"}
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
