"use client";

import { createContext, useCallback, useContext } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ContextValue = {
  navigate: (url: string) => void;
};

const PageTransitionContext = createContext<ContextValue>({
  navigate: () => {},
});

export function usePageNavigate() {
  return useContext(PageTransitionContext).navigate;
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (url: string) => {
      if (url === `${pathname}?${searchParams}`) return;
      router.push(url);
    },
    [router, pathname, searchParams],
  );

  return (
    <PageTransitionContext.Provider value={{ navigate }}>
      {children}
    </PageTransitionContext.Provider>
  );
}
