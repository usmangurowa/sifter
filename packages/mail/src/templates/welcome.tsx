import { Heading, Hr, Section, Text } from "@react-email/components";

import { EmailButton } from "../components/email-button";
import { EmailLayout } from "../components/email-layout";

export interface WelcomeEmailProps {
  /** User's name to personalize the email */
  name: string;
  /** URL for the main call-to-action */
  actionUrl?: string;
  /** Custom action button text */
  actionText?: string;
}

/**
 * Welcome email template for new user signups.
 *
 * @example
 * ```tsx
 * import { sendEmail } from "@turbo/mail/client";
 * import { WelcomeEmail } from "@turbo/mail/templates/welcome";
 *
 * await sendEmail({
 *   to: "user@example.com",
 *   subject: "Welcome to Turbo!",
 *   template: <WelcomeEmail name="John" actionUrl="https://app.example.com" />,
 * });
 * ```
 */
export const WelcomeEmail = ({
  name,
  actionUrl = "#",
  actionText = "Get Started",
}: WelcomeEmailProps) => (
  <EmailLayout preview={`Welcome to Turbo, ${name}!`}>
    <Section className="rounded-lg bg-white p-8">
      <Heading className="text-foreground m-0 mb-4 text-2xl font-bold">
        Welcome, {name}! 🎉
      </Heading>

      <Text className="text-muted-foreground mb-4 text-base">
        We&apos;re thrilled to have you on board. You&apos;ve just taken the
        first step towards an amazing experience.
      </Text>

      <Text className="text-muted-foreground mb-6 text-base">
        Here&apos;s what you can do next:
      </Text>

      <Section className="mb-6">
        <Text className="text-foreground m-0 mb-2 text-base">
          ✓ Complete your profile
        </Text>
        <Text className="text-foreground m-0 mb-2 text-base">
          ✓ Explore the dashboard
        </Text>
        <Text className="text-foreground m-0 text-base">
          ✓ Connect with your team
        </Text>
      </Section>

      <EmailButton href={actionUrl} variant="primary" size="lg">
        {actionText}
      </EmailButton>

      <Hr className="border-border my-6" />

      <Text className="text-muted-foreground m-0 text-sm">
        If you didn&apos;t create an account, you can safely ignore this email.
      </Text>
    </Section>
  </EmailLayout>
);

export default WelcomeEmail;
