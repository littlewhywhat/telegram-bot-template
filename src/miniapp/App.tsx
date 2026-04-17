import { Theme } from '@radix-ui/themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { Route, Routes } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import HomePage from '@/routes/HomePage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Theme>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Theme>
    </QueryClientProvider>
  );
}
