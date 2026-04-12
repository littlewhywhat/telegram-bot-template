import { useEffect, useState } from 'react';

interface TelegramUserState {
  name: string | null;
  loading: boolean;
}

export default function useTelegramUser(): TelegramUserState {
  const [state, setState] = useState<TelegramUserState>({
    name: null,
    loading: true,
  });

  useEffect(() => {
    const initData = window.Telegram?.WebApp.initData;
    if (!initData) {
      setState({ name: null, loading: false });
      return;
    }

    fetch('/api/miniapp/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setState({ name: data?.name ?? null, loading: false }))
      .catch(() => setState({ name: null, loading: false }));
  }, []);

  return state;
}
