import { Suspense } from "react";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

export default function ChatPage() {
  return (
    <div className="flex h-full overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full overflow-hidden p-3 text-sm text-[var(--muted)] sm:p-4 sm:text-base">
            Loading chat...
          </div>
        }
      >
        <ChatWorkspace />
      </Suspense>
    </div>
  );
}
