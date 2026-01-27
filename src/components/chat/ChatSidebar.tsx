"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChatHistoryItem } from "./ChatHistoryItem";
import {
  Plus,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  currentConversationId: string | null;
  isLoading: boolean;
  isCollapsed: boolean;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (id: string, title: string) => void;
  onToggleCollapse: () => void;
  className?: string;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  isLoading,
  isCollapsed,
  onSelectConversation,
  onNewChat,
  onRename,
  onDelete,
  onToggleCollapse,
  className,
}: ChatSidebarProps) {
  return (
    <Card
      className={cn(
        "flex flex-col h-full mr-4 overflow-hidden transition-all duration-300 ease-in-out",
        isCollapsed ? "w-14" : "w-72",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            History
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          className={cn(isCollapsed && "mx-auto")}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand chat sidebar" : "Collapse chat sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        {isCollapsed ? (
          <Button
            variant="strategic"
            size="icon"
            onClick={onNewChat}
            className="w-full"
            title="New Chat"
            aria-label="New chat"
          >
            <Plus className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="strategic"
            onClick={onNewChat}
            className="w-full justify-start gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        )}
      </div>

      {/* Conversation List */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start chatting to create one
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <ChatHistoryItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                onSelect={() => onSelectConversation(conversation.id)}
                onRename={() =>
                  onRename(conversation.id, conversation.title || "New conversation")
                }
                onDelete={() =>
                  onDelete(conversation.id, conversation.title || "New conversation")
                }
              />
            ))
          )}
        </div>
      )}

      {/* Collapsed state - just show icons for recent chats */}
      {isCollapsed && conversations.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.slice(0, 5).map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={cn(
                "w-full p-2 rounded-lg transition-colors",
                conversation.id === currentConversationId
                  ? "bg-primary/10"
                  : "hover:bg-muted"
              )}
              title={conversation.title || "New conversation"}
              aria-label={`Open conversation: ${conversation.title || "New conversation"}`}
            >
              <MessageSquare
                className={cn(
                  "h-4 w-4 mx-auto",
                  conversation.id === currentConversationId
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
