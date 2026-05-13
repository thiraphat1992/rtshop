"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, X, Send, Search, ArrowLeft, Store, Loader2,
  Image as ImageIcon, ShoppingBag, User, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/store/chat";
import { formatPrice } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */

interface NormConv {
  id: string;
  name: string;
  avatar: string | null;
  slug?: string;        // shop slug (buyer)
  shopId?: string;      // shop id   (buyer)
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  updatedAt: string;
}

interface MessageSender {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: MessageSender;
}

interface ShareProduct {
  id: string;
  name: string;
  price: number;
  slug: string;
  image: string;
}

type MsgContent =
  | { type: "text"; text: string }
  | { type: "image"; url: string }
  | { type: "product"; id: string; name: string; price: number; slug: string; image: string };

/* ─── Helpers ────────────────────────────────────────────────── */

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function parseContent(raw: string): MsgContent {
  if (raw.startsWith("{")) {
    try {
      const p = JSON.parse(raw);
      if (p.type === "image" && p.url) return p as MsgContent;
      if (p.type === "product" && p.id) return p as MsgContent;
    } catch {}
  }
  return { type: "text", text: raw };
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── Render message bubble content ─────────────────────────── */

function MsgBubble({ content, isMe, onImageClick }: { content: MsgContent; isMe: boolean; onImageClick?: (url: string) => void }) {
  if (content.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={content.url}
        alt="รูปภาพ"
        className="max-w-[200px] max-h-[200px] rounded-xl object-cover cursor-zoom-in"
        onClick={() => onImageClick?.(content.url)}
      />
    );
  }
  if (content.type === "product") {
    return (
      <Link
        href={`/products/${content.slug}`}
        target="_blank"
        className={cn(
          "flex items-center gap-2 rounded-xl border p-2 min-w-[200px] hover:opacity-90 transition-opacity",
          isMe ? "border-orange-300 bg-orange-600" : "border-gray-200 bg-white"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.image} alt={content.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-medium line-clamp-2", isMe ? "text-white" : "text-gray-800")}>{content.name}</p>
          <p className={cn("text-xs font-bold mt-0.5", isMe ? "text-orange-200" : "text-orange-500")}>
            {formatPrice(content.price)}
          </p>
        </div>
        <ExternalLink className={cn("h-3 w-3 flex-shrink-0", isMe ? "text-orange-200" : "text-gray-400")} />
      </Link>
    );
  }
  return <p className="break-words leading-relaxed text-sm">{content.text}</p>;
}

/* ─── Main component ─────────────────────────────────────────── */

export default function ChatWidget() {
  const { user, loading: authLoading } = useAuth();
  const {
    isOpen, activeConversationId, pendingShopId,
    open, close, setActiveConversation, clearPendingShop,
  } = useChatStore();

  const isSeller = user?.role === "SELLER" || user?.role === "ADMIN";

  const [conversations, setConversations] = useState<NormConv[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [totalUnread, setTotalUnread] = useState(0);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Product picker
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [shareProducts, setShareProducts] = useState<ShareProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ── Normalize API responses ── */
  const normalizeConvsBuyer = (data: unknown[]): NormConv[] =>
    (data as Array<{
      id: string; updatedAt: string; unreadCount: number;
      shop: { id: string; name: string; logo: string | null; slug: string };
      messages: Array<{ content: string; createdAt: string }>;
    }>).map((c) => ({
      id: c.id,
      name: c.shop.name,
      avatar: c.shop.logo,
      slug: c.shop.slug,
      shopId: c.shop.id,
      lastMessage: c.messages[0]?.content ?? null,
      lastMessageAt: c.messages[0]?.createdAt ?? null,
      unreadCount: c.unreadCount ?? 0,
      updatedAt: c.updatedAt,
    }));

  const normalizeConvsSeller = (data: unknown[]): NormConv[] =>
    (data as Array<{
      id: string; updatedAt: string; unreadCount: number;
      user: { id: string; name: string; avatar: string | null };
      messages: Array<{ content: string; createdAt: string }>;
    }>).map((c) => ({
      id: c.id,
      name: c.user.name,
      avatar: c.user.avatar,
      lastMessage: c.messages[0]?.content ?? null,
      lastMessageAt: c.messages[0]?.createdAt ?? null,
      unreadCount: c.unreadCount ?? 0,
      updatedAt: c.updatedAt,
    }));

  /* ── Load conversations ── */
  const loadConversations = useCallback(async () => {
    try {
      const url = isSeller ? "/api/seller/chat/conversations" : "/api/chat/conversations";
      const r = await fetch(url);
      if (!r.ok) return;
      const data = await r.json();
      const norm = isSeller ? normalizeConvsSeller(data) : normalizeConvsBuyer(data);
      setConversations(norm);
      setTotalUnread(norm.reduce((s, c) => s + c.unreadCount, 0));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller]);

  /* ── Load messages ── */
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const r = await fetch(`/api/chat/conversations/${convId}/messages`);
      if (!r.ok) return;
      const data: Message[] = await r.json();
      setMessages(data);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {}
  }, []);

  /* ── Polling ── */
  useEffect(() => {
    if (!isOpen || !user) return;
    setLoadingConvs(true);
    loadConversations().finally(() => setLoadingConvs(false));
    const t = setInterval(loadConversations, 5000);
    return () => clearInterval(t);
  }, [isOpen, user, loadConversations]);

  useEffect(() => {
    if (!activeConversationId) { setMessages([]); return; }
    setLoadingMsgs(true);
    loadMessages(activeConversationId).finally(() => setLoadingMsgs(false));
    const t = setInterval(() => loadMessages(activeConversationId), 3000);
    return () => clearInterval(t);
  }, [activeConversationId, loadMessages]);

  /* ── Pending shop (from product page, buyer only) ── */
  useEffect(() => {
    if (!pendingShopId || !user || isSeller) return;
    fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: pendingShopId }),
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((conv) => {
        if (!conv?.id) throw new Error();
        clearPendingShop();
        setActiveConversation(conv.id);
        setMobileView("chat");
        loadConversations();
      })
      .catch(() => clearPendingShop());
  }, [pendingShopId, user, clearPendingShop, setActiveConversation, loadConversations]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Unread badge when closed — poll conversations for per-chat counts ── */
  useEffect(() => {
    if (!user || isOpen) return;
    loadConversations();
    const t = setInterval(loadConversations, 10000);
    return () => clearInterval(t);
  }, [user, isOpen, loadConversations]);

  /* ── Load products for picker ── */
  const loadShareProducts = useCallback(async () => {
    if (!activeConversationId) return;
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    setLoadingProducts(true);
    try {
      let url = "";
      if (isSeller) {
        url = "/api/seller/products?limit=30";
      } else if (activeConv?.slug) {
        url = `/api/shops/${activeConv.slug}?limit=30`;
      } else return;
      const r = await fetch(url);
      if (!r.ok) return;
      const data = await r.json();
      const raw = isSeller ? (data.products ?? data) : (data.products ?? []);
      setShareProducts(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (raw as any[]).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          slug: p.slug,
          image: p.images?.[0]?.url ?? "https://picsum.photos/seed/default/80/80",
        }))
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [activeConversationId, conversations, isSeller]);

  /* ── Send text message ── */
  const sendMessage = async (content?: string) => {
    const text = content ?? input.trim();
    if (!text || !activeConversationId || sending) return;
    if (!content) setInput("");
    setSending(true);
    try {
      const r = await fetch(`/api/chat/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (r.ok) {
        const msg: Message = await r.json();
        setMessages((prev) => [...prev, msg]);
        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === activeConversationId
                ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
                : c
            )
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        );
      }
    } finally {
      setSending(false);
    }
  };

  /* ── Send image ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const sendImage = async () => {
    if (!imageFile || !activeConversationId || uploadingImage) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error();
      const { url } = await uploadRes.json();
      await sendMessage(JSON.stringify({ type: "image", url }));
      setImageFile(null);
      setImagePreview(null);
    } catch {
      alert("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingImage(false);
    }
  };

  /* ── Send product share ── */
  const sendProduct = async (p: ShareProduct) => {
    setShowProductPicker(false);
    await sendMessage(JSON.stringify({ type: "product", id: p.id, name: p.name, price: p.price, slug: p.slug, image: p.image }));
  };

  const selectConversation = (convId: string) => {
    setActiveConversation(convId);
    setMobileView("chat");
    setShowProductPicker(false);
    setImagePreview(null);
    setImageFile(null);
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const filteredConvs = search
    ? conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : conversations;
  const filteredProducts = productSearch
    ? shareProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : shareProducts;

  /* ── Don't render if no user / loading ── */
  if (authLoading || !user) return null;

  return (
    <>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="รูปภาพ"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Floating round button */}
      {!isOpen && (
        <button
          onClick={open}
          className="fixed bottom-8 right-6 z-50 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="เปิดแชท"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[20px] h-5 bg-black text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 leading-none ring-2 ring-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-8 sm:right-0 w-full sm:w-[720px] h-[100dvh] sm:h-[540px] bg-white sm:rounded-l-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 sm:border-r-0">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-orange-500 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              {mobileView === "chat" && (
                <button
                  onClick={() => { setMobileView("list"); setActiveConversation(null); setShowProductPicker(false); }}
                  className="sm:hidden p-1 hover:bg-orange-600 rounded-lg mr-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">
                {mobileView === "chat" && activeConv ? activeConv.name : "Chat"}
              </span>
              {isSeller && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Seller</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isSeller && (
                <Link
                  href="/seller/chat"
                  className="p-1.5 hover:bg-orange-600 rounded-lg transition-colors"
                  title="เปิดหน้าแชทเต็ม"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              <button onClick={close} className="p-1.5 hover:bg-orange-600 rounded-lg transition-colors" aria-label="ปิด">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* ── Left: Conversation list ── */}
            <div className={cn(
              "flex flex-col border-r border-gray-100 w-full sm:w-64 flex-shrink-0",
              mobileView === "chat" ? "hidden sm:flex" : "flex"
            )}>
              <div className="p-3 border-b border-gray-50">
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isSeller ? "ค้นหาชื่อลูกค้า..." : "ค้นหาชื่อร้าน..."}
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingConvs && conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
                  </div>
                ) : filteredConvs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <MessageCircle className="h-8 w-8 text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400">
                      {search ? "ไม่พบ" : isSeller ? "ยังไม่มีลูกค้าทักมา" : "ยังไม่มีการสนทนา"}
                    </p>
                    {!isSeller && !search && (
                      <p className="text-[10px] text-gray-300 mt-1">กด แชทเลย บนหน้าสินค้าเพื่อเริ่ม</p>
                    )}
                  </div>
                ) : (
                  filteredConvs.map((conv) => {
                    const lastMsg = conv.lastMessage ? parseContent(conv.lastMessage) : null;
                    const lastMsgPreview = lastMsg?.type === "text"
                      ? lastMsg.text
                      : lastMsg?.type === "image" ? "📷 รูปภาพ"
                      : lastMsg?.type === "product" ? `🏷️ ${(lastMsg as { type: "product"; name: string }).name}` : "เริ่มการสนทนา";
                    return (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50",
                          activeConversationId === conv.id && "bg-orange-50 border-l-2 border-l-orange-500"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {conv.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
                          ) : isSeller ? (
                            <span className="text-xs font-bold text-orange-600">{getInitials(conv.name)}</span>
                          ) : (
                            <Store className="h-5 w-5 text-orange-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700")}>
                              {conv.name}
                            </span>
                            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                              {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400")}>
                              {lastMsgPreview}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── Right: Message thread ── */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0",
              mobileView === "list" ? "hidden sm:flex" : "flex"
            )}>
              {!activeConversationId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-3">
                    <MessageCircle className="h-8 w-8 text-orange-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">ยินดีต้อนรับสู่ RTShop Chat</p>
                  <p className="text-xs text-gray-400 mt-1">เลือกการสนทนาเพื่อเริ่มแชท</p>
                </div>
              ) : (
                <>
                  {/* Conversation header (desktop) */}
                  <div className="hidden sm:flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {activeConv?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={activeConv.avatar} alt={activeConv?.name} className="w-full h-full object-cover" />
                      ) : isSeller ? (
                        <span className="text-xs font-bold text-orange-600">{getInitials(activeConv?.name ?? "?")}</span>
                      ) : (
                        <Store className="h-4 w-4 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{activeConv?.name}</p>
                      <p className="text-[10px] text-green-500 flex items-center gap-1">
                        {isSeller ? <User className="h-2.5 w-2.5" /> : <Store className="h-2.5 w-2.5" />}
                        {isSeller ? "ลูกค้า" : "ร้านค้า"}
                      </p>
                    </div>
                    {activeConv?.slug && !isSeller && (
                      <Link href={`/shop/${activeConv.slug}`} target="_blank" className="text-[10px] text-orange-500 hover:underline flex items-center gap-0.5">
                        ดูร้าน <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50/50">
                    {loadingMsgs && messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-xs text-gray-400">ส่งข้อความเพื่อเริ่มการสนทนา</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === user.id;
                        const content = parseContent(msg.content);
                        return (
                          <div key={msg.id} className={cn("flex items-end gap-1.5", isMe ? "justify-end" : "justify-start")}>
                            {!isMe && (
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {msg.sender.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={msg.sender.avatar} alt={msg.sender.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[9px] font-bold text-orange-500">{getInitials(msg.sender.name)}</span>
                                )}
                              </div>
                            )}
                            <div className={cn(
                              "max-w-[75%] rounded-2xl px-3 py-2",
                              content.type !== "image" && (isMe ? "bg-orange-500 text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm"),
                              content.type === "image" && "bg-transparent p-0"
                            )}>
                              <MsgBubble content={content} isMe={isMe} onImageClick={setLightboxUrl} />
                              {content.type !== "product" && (
                                <p className={cn("text-[10px] mt-0.5 text-right", isMe ? "text-orange-200" : "text-gray-400")}>
                                  {formatTime(msg.createdAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Image preview */}
                  {imagePreview && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-orange-50 flex-shrink-0">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-orange-200" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium">รูปภาพที่เลือก</p>
                          <p className="text-[10px] text-gray-400">{imageFile?.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={sendImage}
                            disabled={uploadingImage}
                            className="flex items-center gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                          >
                            {uploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            ส่ง
                          </button>
                          <button
                            onClick={() => { setImagePreview(null); setImageFile(null); }}
                            className="text-xs text-gray-500 hover:text-red-500 px-2 py-1.5 rounded-lg transition-colors"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product picker */}
                  {showProductPicker && (
                    <div className="border-t border-gray-100 bg-white flex-shrink-0 max-h-52 flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-orange-500" />
                          แชร์สินค้า
                        </span>
                        <button onClick={() => setShowProductPicker(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="px-3 py-2 border-b border-gray-50">
                        <input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="ค้นหาสินค้า..."
                          className="w-full text-xs bg-gray-100 rounded-lg px-3 py-1.5 outline-none"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {loadingProducts ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 text-gray-300 animate-spin" />
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">ไม่พบสินค้า</p>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => sendProduct(p)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-orange-50 transition-colors text-left"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                                <p className="text-xs text-orange-500 font-semibold">{formatPrice(p.price)}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Input area */}
                  {!imagePreview && (
                    <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                      {/* Image button */}
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors flex-shrink-0"
                        title="แนบรูปภาพ"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </button>

                      {/* Product share button */}
                      <button
                        onClick={() => {
                          setShowProductPicker((v) => !v);
                          if (!showProductPicker) loadShareProducts();
                        }}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                          showProductPicker
                            ? "bg-orange-500 text-white"
                            : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                        )}
                        title="แชร์สินค้า"
                      >
                        <ShoppingBag className="h-5 w-5" />
                      </button>

                      {/* Text input */}
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder="พิมพ์ข้อความ..."
                        className="flex-1 text-sm bg-gray-100 rounded-xl px-4 py-2.5 outline-none placeholder:text-gray-400 text-gray-800"
                      />

                      {/* Send */}
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || sending}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                          input.trim() && !sending
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
