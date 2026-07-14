import { z } from "zod/v4";

// ============================================================================
// Base Schemas
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters");

export const confirmPasswordSchema = z
  .string()
  .min(1, "Please confirm your password");

export const otpSchema = z
  .string()
  .length(6, "Verification code must be 6 digits")
  .regex(/^\d+$/, "Verification code must only contain numbers");

export const usernameSchema = z
  .string()
  .min(1, "Username is required")
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores",
  );

// ============================================================================
// Auth Form Schemas
// ============================================================================

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Create account form validation schema
 */
export const createAccountSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateAccountFormData = z.infer<typeof createAccountSchema>;

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * OTP verification form validation schema
 */
export const verifyEmailSchema = z.object({
  otp: otpSchema,
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

/**
 * Onboarding profile form validation schema
 */
export const onboardingSchema = z.object({
  username: usernameSchema,
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// ============================================================================
// Settings Schemas (for sync between extension and web)
// ============================================================================

/**
 * Privacy mode enum - matches extension settings
 */
export const privacyModeSchema = z.enum(["normal", "stealth"]);

export type PrivacyMode = z.infer<typeof privacyModeSchema>;

/**
 * User settings schema - all syncable settings between extension and web
 * Used for GET responses and creating new settings rows (with defaults)
 */
export const userSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  privacyMode: privacyModeSchema.default("normal"),
  breakReminderMinutes: z.number().int().min(0).default(90),
  sessionTimeoutMinutes: z.number().int().min(1).max(30).default(15),
  enableTelemetry: z.boolean().default(false),
  captureSymbols: z.boolean().default(false),
  captureCommits: z.boolean().default(true),
  // Web-only: 0 = always fresh, 15 = default
  pulseRefreshMinutes: z.number().int().min(0).max(60).default(15),
  // Dashboard tour completion state
  hasSeenDashboardTour: z.boolean().default(false),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

/**
 * Update settings schema - for PATCH-style updates.
 * IMPORTANT: Does NOT use defaults - only validates the fields that are present.
 * Missing fields remain undefined (not filled with defaults).
 */
export const updateSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  privacyMode: privacyModeSchema.optional(),
  breakReminderMinutes: z.number().int().min(0).optional(),
  sessionTimeoutMinutes: z.number().int().min(1).max(30).optional(),
  enableTelemetry: z.boolean().optional(),
  captureSymbols: z.boolean().optional(),
  captureCommits: z.boolean().optional(),
  pulseRefreshMinutes: z.number().int().min(0).max(60).optional(),
  hasSeenDashboardTour: z.boolean().optional(),
});

export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

// ============================================================================
// Sifter Schemas
// ============================================================================

export const sifterChatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(500),
});

export const sifterDiscountCodeSchema = z.object({
  code: z.string().trim().min(1),
  description: z.string().trim().min(1),
  platform: z.literal("SHEIN"),
});

export const sifterCategorySchema = z.object({
  name: z.string().trim().min(1),
  emoji: z.string().trim().min(1).max(8),
  description: z.string().trim().min(1),
  searchTerms: z.array(z.string().trim().min(1)).min(3).max(6),
  verificationChecks: z.array(z.string().trim().min(1)).min(3).max(6),
  proTip: z.string().trim().min(1).nullable(),
  avoid: z.string().trim().min(1).nullable(),
});

export const sifterChatResponseDataSchema = z.object({
  greeting: z.string().trim().min(1),
  categories: z.array(sifterCategorySchema).min(1).max(5),
  shoppingTips: z.array(z.string().trim().min(1)).min(2).max(6),
  discountCodes: z.array(sifterDiscountCodeSchema).max(5),
});

export const sifterChatSuccessSchema = z.object({
  success: z.literal(true),
  data: sifterChatResponseDataSchema,
});

export const sifterChatErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().trim().min(1),
});

export const sifterChatApiResponseSchema = z.discriminatedUnion("success", [
  sifterChatSuccessSchema,
  sifterChatErrorSchema,
]);

export type SifterChatRequest = z.infer<typeof sifterChatRequestSchema>;
export type SifterDiscountCode = z.infer<typeof sifterDiscountCodeSchema>;
export type SifterCategory = z.infer<typeof sifterCategorySchema>;
export type SifterChatResponseData = z.infer<
  typeof sifterChatResponseDataSchema
>;
export type SifterChatApiResponse = z.infer<typeof sifterChatApiResponseSchema>;
