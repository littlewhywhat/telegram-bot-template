import { Heading, Spinner } from '@radix-ui/themes';
import useTelegramUser from '@/hooks/useTelegramUser';

export default function Hello() {
  const { name, loading } = useTelegramUser();

  if (loading) return <Spinner size="3" />;

  const greeting = name ? `Hello, ${name}!` : 'Hello, stranger!';
  return <Heading size="8">{greeting}</Heading>;
}
