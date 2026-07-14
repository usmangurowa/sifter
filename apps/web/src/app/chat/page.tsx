import { SifterApp } from "@/components/sifter/sifter-app";

interface ChatPageProps {
  searchParams: Promise<{
    q?: string | string[];
  }>;
}

const ChatPage = async ({ searchParams }: ChatPageProps) => {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;

  return <SifterApp initialMessage={query} mode="chat" />;
};

export default ChatPage;
