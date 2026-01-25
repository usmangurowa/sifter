import { Heading, Hr, Section, Text } from "@react-email/components";

import { EmailLayout } from "../components/email-layout";

export interface SupportEmailProps {
  /** User's email address */
  userEmail: string;
  /** User's ID (optional) */
  userId?: string;
  /** Type of message (e.g. feedback, issue) */
  type: string;
  /** The message content */
  message: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Support email template for incoming feedback/support requests.
 */
export const SupportEmail = ({
  userEmail,
  userId,
  type,
  message,
  metadata,
}: SupportEmailProps) => (
  <EmailLayout preview={`New ${type} from ${userEmail}`}>
    <Section className="rounded-lg bg-white p-8">
      <Heading className="text-foreground m-0 mb-4 text-2xl font-bold">
        New {type}
      </Heading>

      <Text className="text-muted-foreground mb-4 text-base">
        <strong>From:</strong> {userEmail} {userId && `(${userId})`}
      </Text>

      <Hr className="border-border my-6" />

      <Text className="text-foreground mb-6 text-base whitespace-pre-wrap">
        {message}
      </Text>

      {metadata && Object.keys(metadata).length > 0 && (
        <>
          <Hr className="border-border my-6" />
          <Heading className="text-foreground m-0 mb-2 text-lg font-bold">
            Metadata
          </Heading>
          <pre className="bg-muted text-muted-foreground rounded p-4 text-xs">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </>
      )}
    </Section>
  </EmailLayout>
);

export default SupportEmail;
