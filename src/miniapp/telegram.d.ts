interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
  };
  ready: () => void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
