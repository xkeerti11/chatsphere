"use client";

import { LoaderCircle, Paperclip, Send } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/lib/client-api";

export function MessageInput({
  onSend,
  onTypingChange,
}: {
  onSend: (payload: { text?: string; fileUrl?: string; fileType?: string }) => Promise<void>;
  onTypingChange?: (isTyping: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function uploadAttachment(file: File) {
    setSending(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "chat_attachment");
      const upload = await apiClient.post<{ success: true; url: string; fileType: string }>(
        "/api/upload",
        formData,
      );
      await onSend({ fileUrl: upload.url, fileType: upload.fileType });
      toast.success("Attachment sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send attachment");
    } finally {
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      setSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend({ text });
      setText("");
      onTypingChange?.(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="flex items-center gap-2" onSubmit={handleSubmit}>
      <button
        type="button"
        className="flex h-11 w-11 min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] p-2.5 text-[var(--brand)] transition hover:opacity-90"
        onClick={() => fileRef.current?.click()}
      >
        <Paperclip size={18} />
      </button>
      <Input
        className="flex-1 rounded-full border px-3 py-2 text-sm sm:px-4 sm:text-base"
        placeholder="Type a message"
        value={text}
        onBlur={() => onTypingChange?.(false)}
        onChange={(event) => {
          const nextValue = event.target.value;
          setText(nextValue);
          onTypingChange?.(nextValue.trim().length > 0);
        }}
      />
      <button
        className="gradient-brand flex h-11 w-11 min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-full p-2.5 text-white shadow-lg shadow-indigo-200 transition disabled:opacity-60"
        disabled={sending}
        type="submit"
      >
        {sending ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}
      </button>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadAttachment(file);
          }
        }}
      />
    </form>
  );
}
