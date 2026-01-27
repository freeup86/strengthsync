"use client";

import { cn, formatRelativeTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { MoreHorizontal, Pencil, Trash2, MessageSquare } from "lucide-react";

interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ChatHistoryItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function ChatHistoryItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ChatHistoryItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
        isActive
          ? "bg-primary/10 border-l-2 border-primary"
          : "hover:bg-muted"
      )}
      onClick={onSelect}
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {conversation.title || "New conversation"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(conversation.updatedAt)}
          {conversation._count.messages > 0 && (
            <span className="ml-1">
              · {conversation._count.messages} msg{conversation._count.messages !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
            aria-label="Conversation options"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
