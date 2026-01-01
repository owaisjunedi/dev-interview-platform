import { lazy, Suspense, useEffect, useState } from 'react';
import { PenTool } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  Tldraw,
  Editor,
} from 'tldraw';

// We need to access the editor instance to sync changes
function WhiteboardEditor({ onMount, sessionId }: { onMount: (editor: Editor) => void, sessionId: string }) {
  const handleMount = (editor: Editor) => {
    onMount(editor);
  };

  return (
    <div className="tldraw__editor w-full h-full">
      <Tldraw onMount={handleMount} persistenceKey={`devinterview-whiteboard-${sessionId}`} />
    </div>
  );
}

export function Whiteboard({ emitWhiteboardUpdate, lastRemoteUpdate, onMount }: { emitWhiteboardUpdate: (data: any) => void, lastRemoteUpdate: any, onMount?: (editor: Editor) => void }) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);

  useEffect(() => {
    if (!editor || !lastRemoteUpdate) return;

    // Apply remote updates
    if (lastRemoteUpdate.changes) {
      setIsRemoteUpdate(true);
      editor.store.mergeRemoteChanges(() => {
        const { added, updated, removed } = lastRemoteUpdate.changes;

        Object.values(added || {}).forEach((record: any) => {
          editor.store.put([record]);
        });
        Object.values(updated || {}).forEach((record: any) => {
          const [from, to] = record;
          editor.store.put([to]);
        });
        Object.values(removed || {}).forEach((record: any) => {
          editor.store.remove([record.id]);
        });
      });
      setIsRemoteUpdate(false);
    }
  }, [editor, lastRemoteUpdate]);

  useEffect(() => {
    if (editor && onMount) {
      onMount(editor);
    }
  }, [editor, onMount]);

  useEffect(() => {
    if (!editor) return;

    const cleanup = editor.store.listen((entry) => {
      if (isRemoteUpdate) return;

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
  }, [editor, emitWhiteboardUpdate, isRemoteUpdate]);

  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-card">
        <div className="text-center text-muted-foreground">
          <PenTool className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
          <p className="text-sm">Loading whiteboard...</p>
        </div>
      </div>
    }>
      <WhiteboardEditor onMount={setEditor} sessionId={sessionId || 'demo'} />
    </Suspense>
  );
}
