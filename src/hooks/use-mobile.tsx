import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    setIsLoaded(true);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Return undefined during hydration to avoid hydration mismatch
  if (!isLoaded) {
    return undefined as any;
  }

  return !!isMobile;
}
