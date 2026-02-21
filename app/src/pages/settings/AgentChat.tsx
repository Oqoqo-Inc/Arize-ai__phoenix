import { useChat } from "@ai-sdk/react";
import { css } from "@emotion/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

import { authFetch } from "@phoenix/authFetch";
import { MessageBar } from "@phoenix/components/chat";

function getTextContent(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const messagesCSS = css`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--global-dimension-size-100);
  padding: var(--global-dimension-size-200);
  min-height: 0;
`;

const userBubbleCSS = css`
  align-self: flex-end;
  background-color: var(--global-color-primary-700);
  color: var(--global-color-gray-50);
  border-radius: var(--global-rounding-large) var(--global-rounding-large) 0
    var(--global-rounding-large);
  padding: var(--global-dimension-size-100) var(--global-dimension-size-150);
  max-width: 75%;
  font-size: var(--global-font-size-s);
  line-height: var(--global-line-height-s);
  word-wrap: break-word;
`;

const assistantBubbleCSS = css`
  align-self: flex-start;
  max-width: 90%;
  font-size: var(--global-font-size-s);
  line-height: var(--global-line-height-s);
`;

const emptyStateCSS = css`
  text-align: center;
  margin-top: var(--global-dimension-size-400);
  color: var(--global-text-color-300);
  font-size: var(--global-font-size-s);
`;

const loadingDotsCSS = css`
  color: var(--global-text-color-300);
  font-size: var(--global-font-size-s);
`;

interface AgentChatProps {
  chatApiUrl: string;
}

export default function AgentChat({ chatApiUrl }: AgentChatProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: chatApiUrl, fetch: authFetch }),
  });
  const isLoading = status === "submitted" || status === "streaming";
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        height: 500px;
      `}
    >
      <div css={messagesCSS}>
        {messages.length === 0 && (
          <p css={emptyStateCSS}>Send a message to start chatting.</p>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} css={userBubbleCSS}>
              {getTextContent(m.parts as { type: string; text?: string }[])}
            </div>
          ) : (
            <div key={m.id} css={assistantBubbleCSS}>
              {(m.parts as { type: string; text?: string }[]).map((part, i) =>
                part.type === "text" ? (
                  <Streamdown key={i}>{part.text ?? ""}</Streamdown>
                ) : null
              )}
            </div>
          )
        )}
        {isLoading && messages.at(-1)?.role !== "assistant" && (
          <p css={loadingDotsCSS}>...</p>
        )}
        <div ref={bottomRef} />
      </div>
      <MessageBar
        onSendMessage={(text) => sendMessage({ text })}
        isSending={isLoading}
        placeholder="Send a message…"
      />
    </div>
  );
}
