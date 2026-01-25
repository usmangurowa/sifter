import { Suspense } from "react";
import { OTPForm } from "@/components/otp-form";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <OTPForm />
    </Suspense>
  );
}
