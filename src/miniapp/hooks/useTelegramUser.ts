import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/lib/api';

function getInitData(): string | undefined {
  return window.Telegram?.WebApp.initData || undefined;
}

export default function useTelegramUser() {
  const initData = getInitData();

  const query = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchMe(initData as string),
    enabled: !!initData,
  });

  return {
    name: query.data?.name ?? null,
    loading: query.isLoading && !!initData,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    initData,
  };
}
