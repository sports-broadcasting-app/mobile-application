import { ReactNode } from 'react';

// The web build has no native splash to take over from.
export function AnimatedSplash({ children }: { children: ReactNode }) {
  return children;
}
