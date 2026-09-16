import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../components/auth/AuthGate';
import { useConversation, useMessages, useSendMessage } from '../hooks/useSpacesQueries';
import { timeAgo } from '../utils/format';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function MessageThreadBoard() {
  const { conversationId } = useParams();
  const { profile } = useAuth();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId, profile.id);
  const { data: messages, isLoading: messagesLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId, profile.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  const submit = () => {
    if (!draft.trim()) return;
    sendMessage.mutate(draft.trim());
    setDraft('');
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-2xl flex-col p-3 sm:p-4">
      <div className="flex flex-1 flex-col border-2 border-black bg-white">
        <div className="flex items-center gap-2 border-b-2 border-black bg-black px-3 py-2 text-cream">
          <Link to="/messages" aria-label="Back to messages">
            <ArrowLeft size={16} />
          </Link>
          {conversationLoading ? (
            <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
          ) : (
            <Link to={`/space/${conversation?.other?.handle}`} className="text-xs font-bold uppercase tracking-widest hover:text-spark">
              {conversation?.other?.display_name}
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {messagesLoading ? (
            <CardSkeleton height={200} />
          ) : (messages ?? []).length === 0 ? (
            <p className="p-6 text-center text-xs text-black/40">Say hi.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => {
                const mine = m.sender_id === profile.id;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[75%] border-2 border-black px-2.5 py-1.5 text-xs ${
                        mine ? 'bg-spark' : 'bg-cream'
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="mt-0.5 text-[9px] text-black/40">{timeAgo(m.created_at)}</span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex gap-1.5 border-t-2 border-black p-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 border-2 border-black px-2 py-1.5 text-xs font-mono"
          />
          <button
            onClick={submit}
            disabled={!draft.trim() || sendMessage.isPending}
            className="flex items-center justify-center border-2 border-black bg-spark px-3 hover:bg-black hover:text-cream disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
