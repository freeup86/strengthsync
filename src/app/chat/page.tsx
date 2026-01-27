"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatRenameDialog } from "@/components/chat/ChatRenameDialog";
import { ErrorBoundary } from "@/components/effects/ErrorBoundary";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  RefreshCw,
  Lightbulb,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

const SUGGESTED_QUESTIONS = [
  "How can I better leverage my top strengths at work?",
  "Who should I partner with on my next project?",
  "What are my team's blind spots and how can we address them?",
  "Who should I recognize for their contributions this week?",
  "What mentorship opportunities would benefit me most?",
];

const SIDEBAR_COLLAPSED_KEY = "chat-sidebar-collapsed";

function generateTitle(firstMessage: string): string {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) return firstMessage;
  return firstMessage.substring(0, maxLength).trim() + "...";
}

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Message state
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Conversation state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dialog state
  const [renameDialog, setRenameDialog] = useState({
    open: false,
    conversationId: "",
    currentTitle: "",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    conversationId: "",
    conversationTitle: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount and when conversation changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentConversationId]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const res = await fetch("/api/ai/chat/conversations");
      if (res.ok) {
        const result = await res.json();
        setConversations(result.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setShowSuggestions(false);
      setMobileSidebarOpen(false);

      const res = await fetch(`/api/ai/chat/conversations/${conversationId}`);
      if (!res.ok) {
        throw new Error("Failed to load conversation");
      }

      const result = await res.json();
      const conversation = result.data;

      // Transform messages from DB format to frontend format
      const loadedMessages: Message[] = conversation.messages.map(
        (m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role.toLowerCase() as "user" | "assistant",
          content: m.content,
        })
      );

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowSuggestions(true);
    setError(null);
    setMobileSidebarOpen(false);
    inputRef.current?.focus();
  };

  const createConversation = async (title: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/ai/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        throw new Error("Failed to create conversation");
      }

      const result = await res.json();
      const newConversation = result.data;

      // Add to conversations list at the top
      setConversations((prev) => [
        {
          id: newConversation.id,
          title: newConversation.title,
          createdAt: newConversation.createdAt,
          updatedAt: newConversation.updatedAt,
          _count: { messages: 0 },
        },
        ...prev,
      ]);

      return newConversation.id;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  };

  const handleRename = async (newTitle: string) => {
    const { conversationId } = renameDialog;
    if (!conversationId) return;

    try {
      const res = await fetch(`/api/ai/chat/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!res.ok) {
        throw new Error("Failed to rename conversation");
      }

      // Update local state
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, title: newTitle } : c
        )
      );
    } catch (err) {
      console.error("Failed to rename conversation:", err);
      throw err;
    }
  };

  const handleDelete = async () => {
    const { conversationId } = deleteDialog;
    if (!conversationId) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/ai/chat/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete conversation");
      }

      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      // If deleted conversation was active, start new chat
      if (currentConversationId === conversationId) {
        startNewChat();
      }

      setDeleteDialog({ open: false, conversationId: "", conversationTitle: "" });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSidebarCollapsed = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setShowSuggestions(false);

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");

      let conversationId = currentConversationId;

      // Create conversation if this is the first message
      if (!conversationId) {
        const title = generateTitle(content.trim());
        conversationId = await createConversation(title);
        if (conversationId) {
          setCurrentConversationId(conversationId);
        }
      }

      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            conversationId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to get response");
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "",
        };
        setMessages((prev) => [...prev, assistantMessage]);

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Update the assistant message with streamed content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: fullContent } : m
            )
          );
        }

        // Update conversation's updatedAt in local state
        if (conversationId) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? { ...c, updatedAt: new Date().toISOString(), _count: { messages: c._count.messages + 2 } }
                : c
            ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          );
        }
      } catch (err) {
        console.error("Chat error:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, currentConversationId]
  );

  const handleSend = useCallback(() => {
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      // Remove last assistant message if it exists
      setMessages((prev) => {
        const lastIndex = prev.findLastIndex((m) => m.role === "assistant");
        if (lastIndex !== -1 && lastIndex === prev.length - 1) {
          return prev.slice(0, lastIndex);
        }
        return prev;
      });
      sendMessage(lastUserMessage.content);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-overlay bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-modal md:hidden transform transition-transform duration-300",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          isLoading={isLoadingConversations}
          isCollapsed={false}
          onSelectConversation={loadConversation}
          onNewChat={startNewChat}
          onRename={(id, title) =>
            setRenameDialog({ open: true, conversationId: id, currentTitle: title })
          }
          onDelete={(id, title) =>
            setDeleteDialog({ open: true, conversationId: id, conversationTitle: title })
          }
          onToggleCollapse={() => setMobileSidebarOpen(false)}
          className="h-full"
        />
      </div>

      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden shrink-0 mt-1"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-domain-strategic shrink-0" />
            <span className="truncate">StrengthSync AI</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Ask questions about your team&apos;s strengths, find collaborators, or
            learn about CliftonStrengths
          </p>
        </div>
      </div>

      {/* Main content area - Sidebar + Chat */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Desktop */}
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          isLoading={isLoadingConversations}
          isCollapsed={sidebarCollapsed}
          onSelectConversation={loadConversation}
          onNewChat={startNewChat}
          onRename={(id, title) =>
            setRenameDialog({ open: true, conversationId: id, currentTitle: title })
          }
          onDelete={(id, title) =>
            setDeleteDialog({ open: true, conversationId: id, conversationTitle: title })
          }
          onToggleCollapse={toggleSidebarCollapsed}
          className="hidden md:flex"
        />

        {/* Messages area */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && showSuggestions && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <Sparkles className="h-10 w-10 text-domain-strategic mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  How can I help you today?
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  I can help you explore your team&apos;s strengths, find the right
                  collaborators, and understand CliftonStrengths themes.
                </p>

                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(question)}
                      className="px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 text-left transition-colors flex items-center gap-2"
                    >
                      <Lightbulb className="h-4 w-4 text-domain-influencing shrink-0" />
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ErrorBoundary>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-domain-strategic text-white dark:bg-domain-strategic/80">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-strong:text-foreground prose-headings:my-3">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-domain-influencing text-white dark:bg-domain-influencing/80">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </ErrorBoundary>

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-domain-strategic text-white dark:bg-domain-strategic/80">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-muted">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3 items-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-destructive text-white dark:bg-destructive/80">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive mb-2">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your team's strengths..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[48px] max-h-32"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="button"
                variant="default"
                size="icon"
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="h-12 w-12 rounded-xl shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI responses are generated based on your team&apos;s data
            </p>
          </div>
        </Card>
      </div>

      {/* Rename Dialog */}
      <ChatRenameDialog
        open={renameDialog.open}
        onOpenChange={(open) =>
          setRenameDialog((prev) => ({ ...prev, open }))
        }
        currentTitle={renameDialog.currentTitle}
        onSave={handleRename}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
        title="Delete conversation"
        description={`Are you sure you want to delete "${deleteDialog.conversationTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
