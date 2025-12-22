import { lazy, Suspense } from 'react';
import { PenTool } from 'lucide-react';

const TldrawEditor = lazy(() => import('tldraw').then(mod => ({ default: mod.Tldraw })));

export function Whiteboard() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-card">
        <div className="text-center text-muted-foreground">
          <PenTool className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
          <p className="text-sm">Loading whiteboard...</p>
        </div>
      </div>
    }>
      <TldrawEditor />
    </Suspense>
  );
}
