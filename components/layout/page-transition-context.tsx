"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ContextValue = {
  isPending: boolean;
  navigate: (url: string) => void;
  /** Start a load — increments pending counter. Must pair with endLoad(). */
  startLoad: () => void;
  /** End a load — decrements pending counter. Hides bar when counter reaches 0. */
  endLoad: () => void;
};

const PageTransitionContext = createContext<ContextValue>({
  isPending: false,
  navigate: () => {},
  startLoad: () => {},
  endLoad: () => {},
});

export function usePageLoading() {
  return useContext(PageTransitionContext).isPending;
}

export function usePageNavigate() {
  return useContext(PageTransitionContext).navigate;
}

/** Returns { startLoad, endLoad } for wrapping async API calls. */
export function usePageLoadHandle() {
  const { startLoad, endLoad } = useContext(PageTransitionContext);
  return { startLoad, endLoad };
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(0);

  // When the URL settles, navigation is done — clear pending from navigate().
  useEffect(() => {
    setIsPending(false);
  }, [pathname, searchParams]);

  const startLoad = useCallback(() => {
    pendingRef.current++;
    setIsPending(true);
  }, []);

  const endLoad = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    if (pendingRef.current === 0) setIsPending(false);
  }, []);

  const navigate = useCallback(
    (url: string) => {
      if (url === `${pathname}?${searchParams}`) return;
      setIsPending(true);
      router.push(url);
    },
    [router, pathname, searchParams],
  );

  return (
    <PageTransitionContext.Provider value={{ isPending, navigate, startLoad, endLoad }}>
      {children}
    </PageTransitionContext.Provider>
  );
}
