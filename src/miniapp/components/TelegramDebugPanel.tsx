import {
  Badge,
  Box,
  Button,
  Code,
  DataList,
  Heading,
  Text,
} from '@radix-ui/themes';
import useTelegramUser from '@/hooks/useTelegramUser';

function getTelegramDebugInfo() {
  const tg = window.Telegram;
  const webApp = tg?.WebApp;
  return {
    hasTelegram: !!tg,
    hasWebApp: !!webApp,
    initData: webApp?.initData ?? '',
    user: webApp?.initDataUnsafe?.user ?? null,
  };
}

export default function TelegramDebugPanel() {
  const { name, loading, error, isFetching, refetch, initData } =
    useTelegramUser();
  const debug = getTelegramDebugInfo();

  const apiStatus = loading
    ? 'loading'
    : error
      ? 'error'
      : name
        ? 'success'
        : 'no-data';

  const statusColor = {
    loading: 'blue' as const,
    error: 'red' as const,
    success: 'green' as const,
    'no-data': 'orange' as const,
  }[apiStatus];

  return (
    <Box
      p="4"
      style={{
        border: '1px solid var(--gray-6)',
        borderRadius: 'var(--radius-3)',
        width: '100%',
        maxWidth: 480,
      }}
    >
      <Heading size="3" mb="3">
        Debug: Telegram Context
      </Heading>

      <DataList.Root size="2">
        <DataList.Item>
          <DataList.Label>window.Telegram</DataList.Label>
          <DataList.Value>
            <Badge color={debug.hasTelegram ? 'green' : 'red'}>
              {debug.hasTelegram ? 'present' : 'missing'}
            </Badge>
          </DataList.Value>
        </DataList.Item>

        <DataList.Item>
          <DataList.Label>WebApp</DataList.Label>
          <DataList.Value>
            <Badge color={debug.hasWebApp ? 'green' : 'red'}>
              {debug.hasWebApp ? 'present' : 'missing'}
            </Badge>
          </DataList.Value>
        </DataList.Item>

        <DataList.Item>
          <DataList.Label>initData</DataList.Label>
          <DataList.Value>
            {debug.initData ? (
              <Code truncate style={{ maxWidth: 260 }}>
                {debug.initData}
              </Code>
            ) : (
              <Badge color="red">empty</Badge>
            )}
          </DataList.Value>
        </DataList.Item>

        {debug.user && (
          <>
            <DataList.Item>
              <DataList.Label>user.id</DataList.Label>
              <DataList.Value>
                <Code>{debug.user.id}</Code>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label>user.first_name</DataList.Label>
              <DataList.Value>
                <Code>{debug.user.first_name}</Code>
              </DataList.Value>
            </DataList.Item>
            {debug.user.username && (
              <DataList.Item>
                <DataList.Label>user.username</DataList.Label>
                <DataList.Value>
                  <Code>@{debug.user.username}</Code>
                </DataList.Value>
              </DataList.Item>
            )}
          </>
        )}
      </DataList.Root>

      <Heading size="3" mt="4" mb="3">
        Debug: API /api/me
      </Heading>

      <DataList.Root size="2">
        <DataList.Item>
          <DataList.Label>Status</DataList.Label>
          <DataList.Value>
            <Badge color={statusColor}>{apiStatus}</Badge>
          </DataList.Value>
        </DataList.Item>

        <DataList.Item>
          <DataList.Label>initData sent</DataList.Label>
          <DataList.Value>
            <Badge color={initData ? 'green' : 'red'}>
              {initData ? 'yes' : 'no (query disabled)'}
            </Badge>
          </DataList.Value>
        </DataList.Item>

        {name && (
          <DataList.Item>
            <DataList.Label>Returned name</DataList.Label>
            <DataList.Value>
              <Code>{name}</Code>
            </DataList.Value>
          </DataList.Item>
        )}

        {error && (
          <DataList.Item>
            <DataList.Label>Error</DataList.Label>
            <DataList.Value>
              <Text color="red">{(error as Error).message}</Text>
            </DataList.Value>
          </DataList.Item>
        )}
      </DataList.Root>

      <Button
        mt="4"
        variant="outline"
        loading={isFetching}
        onClick={() => refetch()}
        disabled={!initData}
      >
        Refetch User
      </Button>
    </Box>
  );
}
