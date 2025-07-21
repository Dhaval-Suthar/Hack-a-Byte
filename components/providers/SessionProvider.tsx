'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  children: ReactNode;
};

export default function NextAuthSessionProvider({ children }: Props) {
  const pathname = usePathname();
  
  // Determine session refresh interval based on route
  // Admin routes need more frequent refreshing to ensure permissions are up-to-date
  const refreshInterval = pathname.startsWith('/admin') ? 5 * 60 : 60 * 60; // 5 mins for admin, 60 mins for regular routes
  
  return (
    <SessionProvider refetchInterval={refreshInterval} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
}
