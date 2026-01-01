import { lazy, Suspense, useEffect, useState } from 'react';
import { PenTool } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  Tldraw,
  Editor,
  TLStore,
} from 'tldraw';

// We need to access the editor instance to sync changes
function WhiteboardEditor({ onMount, sessionId, store }: { onMount: (editor: Editor) => void, sessionId: string, store: TLStore }) {
  const handleMount = (editor: Editor) => {
    onMount(editor);
  };

  return (
    <div className="tldraw__editor w-full h-full">
      <Tldraw
        onMount={handleMount}
        store={store}
        persistenceKey={`devinterview-whiteboard-${sessionId}`}
      />
    </div>
  );
}

export function Whiteboard({ emitWhiteboardUpdate, store }: { emitWhiteboardUpdate: (data: any) => void, store: TLStore }) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    if (!editor) return;

    const cleanup = editor.store.listen((entry) => {
      // entry has { changes: { added, updated, removed }, source: 'user' | 'remote' }
      if (entry.source !== 'user') return;

      const { changes } = entry;
      // Only emit if there are actual changes
      if (Object.keys(changes.added).length > 0 ||
        Object.keys(changes.updated).length > 0 ||
        Object.keys(changes.removed).length > 0) {

        emitWhiteboardUpdate({ changes });
      }
    });

    return () => cleanup();
  }, [editor, emitWhiteboardUpdate]);

  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-card">
        <div className="text-center text-muted-foreground">
          <PenTool className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
          <p className="text-sm">Loading whiteboard...</p>
        </div>
      </div>
    }>
      <WhiteboardEditor onMount={setEditor} sessionId={sessionId || 'demo'} store={store} />
    </Suspense>
  );
}
