import { lazy, Suspense, useEffect, useState } from 'react';
import { PenTool } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Tldraw,
  useEditor,
  Editor,
  StoreSnapshot,
  TLRecord
} from 'tldraw';

// We need to access the editor instance to sync changes
function WhiteboardEditor({ onMount }: { onMount: (editor: Editor) => void }) {
  const handleMount = (editor: Editor) => {
    onMount(editor);
  };

  return (
    <div className="tldraw__editor w-full h-full">
      <Tldraw onMount={handleMount} persistenceKey="devinterview-whiteboard" />
    </div>
  );
}

export function Whiteboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') || 'candidate') as 'interviewer' | 'candidate';
  const { user } = useAuth();
  const userId = user?.id || localStorage.getItem('candidate_session') || 'guest';
  const userName = user?.name || localStorage.getItem('candidate_name') || 'Guest';

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);

  const { emitWhiteboardUpdate } = useSocket({
    sessionId: sessionId || '',
    userId,
    userName,
    role,
    onWhiteboardUpdate: (data: any) => {
      if (!editor) return;

      // Apply remote updates
      // data should be a list of records to update/remove
      // For simplicity, we'll assume data is { changes: { added: {}, updated: {}, removed: {} } }
      // or just a snapshot. Let's try to handle incremental updates if possible, 
      // but for now, let's assume the backend broadcasts the 'changes' object from Tldraw.

      if (data.changes) {
        setIsRemoteUpdate(true);
        editor.store.mergeRemoteChanges(() => {
          const { added, updated, removed } = data.changes;
          // Tldraw mergeRemoteChanges expects an array of records? 
          // Actually, it's simpler to just use put/remove if we have the records.
          // Let's look at the data structure.
          // If we send the 'changes' object from store.listen, it has { added, updated, removed } maps.

          Object.values(added).forEach((record: any) => {
            editor.store.put([record]);
          });
          Object.values(updated).forEach((record: any) => {
            const [from, to] = record; // updated is Record<Id, [from, to]>
            editor.store.put([to]);
          });
          Object.values(removed).forEach((record: any) => {
            editor.store.remove([record.id]);
          });
        });
        setIsRemoteUpdate(false);
      }
    }
  });

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
      <WhiteboardEditor onMount={setEditor} />
    </Suspense>
  );
}
