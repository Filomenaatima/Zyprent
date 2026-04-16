"use client";

import "@/styles/messages.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type ConversationUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
};

type ConversationParticipant = {
  id: string;
  conversationId: string;
  userId: string;
  user: ConversationUser;
};

type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: ConversationUser;
};

type ConversationItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages: ConversationMessage[];
};

type FullMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: ConversationUser;
};

type ContactItem = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
};

function formatRole(role?: string) {
  if (!role) return "User";
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatConversationTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function getInitials(name?: string | null, email?: string | null) {
  const source = (name || email || "U").trim();

  if (!source.includes(" ")) {
    return source.slice(0, 1).toUpperCase();
  }

  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<FullMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  async function loadConversations() {
    try {
      setLoadingList(true);
      const res = await api.get<ConversationItem[]>("/messages/me");
      const items = res.data ?? [];
      setConversations(items);

      if (!activeConversationId && items.length > 0) {
        setActiveConversationId(items[0].id);
      }

      if (items.length === 0) {
        setActiveConversationId("");
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load conversations", error);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadContacts() {
    try {
      setLoadingContacts(true);
      const res = await api.get<ContactItem[]>("/messages/contacts");
      setContacts(res.data ?? []);
    } catch (error) {
      console.error("Failed to load contacts", error);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function loadConversationMessages(conversationId: string) {
    if (!conversationId) return;

    try {
      setLoadingMessages(true);
      const res = await api.get<FullMessage[]>(
        `/messages/conversation/${conversationId}`,
      );
      const rows = res.data ?? [];
      setMessages(rows);

      for (const row of rows) {
        if (row.senderId !== currentUserId && !row.readAt) {
          try {
            await api.patch(`/messages/${row.id}/read`);
          } catch (error) {
            console.error("Failed to mark message as read", error);
          }
        }
      }

      await loadConversations();
    } catch (error) {
      console.error("Failed to load conversation messages", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadConversations();
    loadContacts();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      140,
    )}px`;
  }, [draft]);

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const otherParticipant = conversation.participants.find(
        (participant) => participant.userId !== currentUserId,
      );

      const participantText = `${otherParticipant?.user.name ?? ""} ${
        otherParticipant?.user.email ?? ""
      } ${otherParticipant?.user.role ?? ""}`.toLowerCase();

      const lastMessageText =
        conversation.messages?.[0]?.content?.toLowerCase?.() ?? "";

      return participantText.includes(term) || lastMessageText.includes(term);
    });
  }, [conversations, search, currentUserId]);

  const filteredContacts = useMemo(() => {
    const term = contactSearch.trim().toLowerCase();
    if (!term) return contacts;

    return contacts.filter((contact) => {
      const text = `${contact.name ?? ""} ${contact.email ?? ""} ${contact.role ?? ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [contacts, contactSearch]);

  const activeConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === activeConversationId);
  }, [conversations, activeConversationId]);

  const activeParticipant = useMemo(() => {
    return activeConversation?.participants.find(
      (participant) => participant.userId !== currentUserId,
    );
  }, [activeConversation, currentUserId]);

  const unreadCount = useMemo(() => {
    return conversations.reduce((count, conversation) => {
      const latest = conversation.messages?.[0];
      if (latest && latest.senderId !== currentUserId && !latest.readAt) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [conversations, currentUserId]);

  const latestActivity = useMemo(() => {
    const timestamps = conversations
      .flatMap((conversation) =>
        conversation.messages.map((message) => new Date(message.createdAt).getTime()),
      )
      .filter(Boolean);

    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps));
  }, [conversations]);

  const availableContactsWithoutConversation = useMemo(() => {
    const existingParticipantIds = new Set(
      conversations.flatMap((conversation) =>
        conversation.participants
          .filter((participant) => participant.userId !== currentUserId)
          .map((participant) => participant.userId),
      ),
    );

    return filteredContacts.filter((contact) => !existingParticipantIds.has(contact.id));
  }, [filteredContacts, conversations, currentUserId]);

  async function handleSendMessage() {
    if (!draft.trim() || !activeConversationId || sending) return;

    try {
      setSending(true);

      await api.post("/messages/send", {
        conversationId: activeConversationId,
        content: draft.trim(),
      });

      setDraft("");
      await loadConversationMessages(activeConversationId);
      await loadConversations();
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  }

  async function handleCreateConversation(otherUserId: string) {
    try {
      const res = await api.post("/messages/conversation", {
        otherUserId,
      });

      const conversationId = res.data?.id;
      await loadConversations();
      await loadContacts();

      if (conversationId) {
        setActiveConversationId(conversationId);
      }

      setShowNewConversation(false);
      setContactSearch("");
    } catch (error) {
      console.error("Failed to create conversation", error);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="messages-shell">
      <section className="messages-hero">
        <div className="messages-hero-copy">
          <p className="messages-eyebrow">Investor Messages</p>
          <h1 className="messages-title">
            Secure conversations with your relationship team
          </h1>
          <p className="messages-text">
            Keep a permanent record of your investment communication with verified
            Zyprent-connected contacts. Use this space for portfolio questions,
            distribution follow-up, property updates, and manager support.
          </p>

          <div className="messages-hero-tags">
            <span className="messages-hero-tag">Stored conversation history</span>
            <span className="messages-hero-tag">Role-based access</span>
            <span className="messages-hero-tag">Manager communication</span>
            <span className="messages-hero-tag">Audit-friendly records</span>
          </div>
        </div>

        <div className="messages-hero-stats">
          <div className="messages-stat-card dark">
            <span>Open Conversations</span>
            <strong>{conversations.length}</strong>
          </div>

          <div className="messages-stat-card">
            <span>Unread Threads</span>
            <strong>{unreadCount}</strong>
          </div>

          <div className="messages-stat-card">
            <span>Primary Contact</span>
            <strong>{activeParticipant?.user.name ?? "—"}</strong>
          </div>

          <div className="messages-stat-card">
            <span>Latest Activity</span>
            <strong>
              {latestActivity ? formatDateLabel(latestActivity.toISOString()) : "—"}
            </strong>
          </div>
        </div>
      </section>

      <section className="messages-workspace">
        <aside className="messages-sidebar-panel">
          <div className="messages-panel-head">
            <div>
              <h2 className="messages-panel-title">Conversations</h2>
              <p className="messages-panel-subtitle">Connected contacts only</p>
            </div>

            <button
              type="button"
              className="messages-new-button"
              onClick={() => setShowNewConversation((prev) => !prev)}
            >
              {showNewConversation ? "Close" : "New"}
            </button>
          </div>

          <div className="messages-search-wrap">
            <input
              className="messages-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
            />
          </div>

          {showNewConversation ? (
            <div className="messages-new-panel">
              <input
                className="messages-search-input"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search allowed contacts"
              />

              <div className="messages-contact-list">
                {loadingContacts ? (
                  <div className="messages-empty compact">Loading contacts...</div>
                ) : availableContactsWithoutConversation.length === 0 ? (
                  <div className="messages-empty compact">
                    No available contacts.
                    <br />
                    <span>
                      Allowed contacts will appear here when a verified relationship exists.
                    </span>
                  </div>
                ) : (
                  availableContactsWithoutConversation.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      className="messages-contact-card"
                      onClick={() => handleCreateConversation(contact.id)}
                    >
                      <div className="messages-avatar">
                        {getInitials(contact.name, contact.email)}
                      </div>

                      <div className="messages-contact-main">
                        <strong>{contact.name || contact.email || "Unknown User"}</strong>
                        <span>{formatRole(contact.role)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <div className="messages-conversation-list">
            {loadingList ? (
              <div className="messages-empty">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="messages-empty">
                No conversations yet.
                <br />
                <span>
                  Start a secure conversation with an allowed contact using the New button.
                </span>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = conversation.participants.find(
                  (participant) => participant.userId !== currentUserId,
                );

                const lastMessage = conversation.messages?.[0];
                const isActive = conversation.id === activeConversationId;
                const isUnread =
                  !!lastMessage &&
                  lastMessage.senderId !== currentUserId &&
                  !lastMessage.readAt;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`messages-conversation-card ${isActive ? "active" : ""}`}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className="messages-avatar">
                      {getInitials(
                        otherParticipant?.user.name,
                        otherParticipant?.user.email,
                      )}
                    </div>

                    <div className="messages-conversation-main">
                      <div className="messages-conversation-top">
                        <strong>
                          {otherParticipant?.user.name ||
                            otherParticipant?.user.email ||
                            "Unknown User"}
                        </strong>

                        <span>
                          {lastMessage?.createdAt
                            ? formatConversationTime(lastMessage.createdAt)
                            : ""}
                        </span>
                      </div>

                      <div className="messages-conversation-meta">
                        <span className="messages-role-pill">
                          {formatRole(otherParticipant?.user.role)}
                        </span>
                        {isUnread ? <span className="messages-unread-dot" /> : null}
                      </div>

                      <p className="messages-conversation-preview">
                        {lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="messages-thread-panel">
          {!activeConversation ? (
            <div className="messages-thread-empty">
              <h3>No active conversation</h3>
              <p>
                Open a secure thread from the left panel. Only verified Zyprent-connected
                contacts can be messaged here.
              </p>
            </div>
          ) : (
            <>
              <div className="messages-thread-head">
                <div className="messages-thread-user">
                  <div className="messages-thread-avatar">
                    {getInitials(
                      activeParticipant?.user.name,
                      activeParticipant?.user.email,
                    )}
                  </div>

                  <div>
                    <h2>
                      {activeParticipant?.user.name ||
                        activeParticipant?.user.email ||
                        "Unknown User"}
                    </h2>
                    <p>{formatRole(activeParticipant?.user.role)}</p>
                  </div>
                </div>

                <div className="messages-thread-badges">
                  <span className="messages-thread-chip">Secure thread</span>
                  <span className="messages-thread-chip">Stored for reference</span>
                </div>
              </div>

              <div className="messages-thread-body">
                {loadingMessages ? (
                  <div className="messages-empty">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="messages-empty">
                    No messages yet.
                    <br />
                    <span>Start the conversation below.</span>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isMine = message.senderId === currentUserId;
                    const previous = messages[index - 1];
                    const showDateDivider =
                      !previous ||
                      formatDateLabel(previous.createdAt) !==
                        formatDateLabel(message.createdAt);

                    return (
                      <div key={message.id}>
                        {showDateDivider ? (
                          <div className="messages-date-divider">
                            <span>{formatDateLabel(message.createdAt)}</span>
                          </div>
                        ) : null}

                        <div
                          className={`messages-bubble-row ${
                            isMine ? "mine" : "theirs"
                          }`}
                        >
                          <div
                            className={`messages-bubble ${
                              isMine ? "mine" : "theirs"
                            }`}
                          >
                            {!isMine ? (
                              <strong className="messages-bubble-name">
                                {message.sender.name ||
                                  message.sender.email ||
                                  "Unknown User"}
                              </strong>
                            ) : null}

                            <p>{message.content}</p>

                            <div className="messages-bubble-meta">
                              <span>{formatTime(message.createdAt)}</span>
                              {isMine ? (
                                <span>{message.readAt ? "Read" : "Sent"}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="messages-composer">
                <textarea
                  ref={textareaRef}
                  className="messages-textarea"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Write your message..."
                  rows={1}
                />

                <button
                  type="button"
                  className="messages-send-button"
                  disabled={!draft.trim() || sending}
                  onClick={handleSendMessage}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </>
          )}
        </section>
      </section>
    </div>
  );
}