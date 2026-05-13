"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageCircle, Send, Search, Loader2, User,
  X, Image as ImageIcon, ShoppingBag, ExternalLink, Store,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import SellerTopbar from "@/components/seller/SellerTopbar";

/* ─── Types ─────────────────────────────────────────────────── */

interface ConvUser { id: string; name: string; avatar: string | null }

interface Conversation {
  id: string;
  user: ConvUser;
  messages: Array<{ content: string; createdAt: string }>;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null; role: string };
}

interface ShareProduct {
  id: string; name: string; price: number; slug: string; image: string;
}

type MsgContent =
  | { type: "text"; text: string }
  | { type: "image"; url: string }
  | { type: "product"; id: string; name: string; price: number; slug: string; image: string };

/* ─── Helpers ────────────────────────────────────────────────── */

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

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function previewContent(raw: string) {
  const c = parseContent(raw);
  if (c.type === "image") return "📷 รูปภาพ";
  if (c.type === "product") return `🏷️ ${c.name}`;
  return c.text;
}

/* ─── Message bubble ─────────────────────────────────────────── */

function MsgBubble({
  content, isMe, onImageClick,
}: {
  content: MsgContent; isMe: boolean; onImageClick: (url: string) => void;
}) {
  if (content.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={content.url}
        alt="รูปภาพ"
        className="max-w-[220px] max-h-[220px] rounded-xl object-cover cursor-zoom-in"
        onClick={() => onImageClick(content.url)}
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
          <p className={cn("text-xs font-bold mt-0.5", isMe ? "text-orange-200" : "text-orange-500")}>{formatPrice(content.price)}</p>
        </div>
        <ExternalLink className={cn("h-3 w-3 flex-shrink-0", isMe ? "text-orange-200" : "text-gray-400")} />
      </Link>
    );
  }
  return <p className="break-words leading-relaxed text-sm">{content.text}</p>;
}

/* ─── Main page ──────────────────────────────────────────────── */

function SellerChatInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conv");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">(initialConvId ? "chat" : "list");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Product share
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [shareProducts, setShareProducts] = useState<ShareProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  /* ── Load conversations ── */
  const loadConversations = useCallback(async () => {
    try {
      const r = await fetch("/api/seller/chat/conversations");
      if (!r.ok) return;
      const data: Conversation[] = await r.json();
      setConversations(data);
    } catch {}
  }, []);

  /* ── Load messages (only scroll when new messages arrive) ── */
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const r = await fetch(`/api/chat/conversations/${convId}/messages`);
      if (!r.ok) return;
      const data: Message[] = await r.json();
      setMessages((prev) => {
        if (data.length !== prev.length) prevMsgCount.current = -1; // signal scroll
        return data;
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {}
  }, []);

  // Auto-scroll only when new messages arrive
  useEffect(() => {
    if (prevMsgCount.current === -1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevMsgCount.current = messages.length;
    }
  }, [messages]);

  /* ── Polling ── */
  useEffect(() => {
    loadConversations().finally(() => setLoadingConvs(false));
    const t = setInterval(loadConversations, 5000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    prevMsgCount.current = -1;
    setLoadingMsgs(true);
    loadMessages(activeConvId).finally(() => setLoadingMsgs(false));
    const t = setInterval(() => loadMessages(activeConvId), 3000);
    return () => clearInterval(t);
  }, [activeConvId, loadMessages]);

  /* ── Load seller's products ── */
  const loadShareProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const r = await fetch("/api/seller/products");
      if (!r.ok) return;
      const data = await r.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setShareProducts((data.products ?? []).map((p: any) => ({
        id: p.id, name: p.name, price: Number(p.price), slug: p.slug,
        image: p.images?.[0]?.url ?? "https://picsum.photos/seed/default/80/80",
      })));
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  /* ── Send message ── */
  const sendMessage = async (content?: string) => {
    const text = content ?? input.trim();
    if (!text || !activeConvId || sending) return;
    if (!content) setInput("");
    setSending(true);
    try {
      const r = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (r.ok) {
        const msg: Message = await r.json();
        setMessages((prev) => {
          prevMsgCount.current = -1;
          return [...prev, msg];
        });
        setConversations((prev) =>
          prev
            .map((c) => c.id === activeConvId ? { ...c, messages: [{ content: text, createdAt: new Date().toISOString() }], updatedAt: new Date().toISOString() } : c)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        );
      }
    } finally {
      setSending(false);
    }
  };

  /* ── Image ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const sendImage = async () => {
    if (!imageFile || uploadingImage) return;
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
    } catch { alert("อัปโหลดรูปไม่สำเร็จ"); }
    finally { setUploadingImage(false); }
  };

  /* ── Product share ── */
  const sendProduct = async (p: ShareProduct) => {
    setShowProductPicker(false);
    await sendMessage(JSON.stringify({ type: "product", id: p.id, name: p.name, price: p.price, slug: p.slug, image: p.image }));
  };

  const selectConv = (convId: string) => {
    setActiveConvId(convId);
    setMobileView("chat");
    setShowProductPicker(false);
    setImagePreview(null);
    setImageFile(null);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const filteredConvs = search
    ? conversations.filter((c) => c.user.name.toLowerCase().includes(search.toLowerCase()))
    : conversations;
  const filteredProducts = productSearch
    ? shareProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : shareProducts;

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount ?? 0), 0);

  return (
    <>
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="รูปภาพ" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="flex flex-col h-screen">
        <SellerTopbar title={`แชท${totalUnread > 0 ? ` (${totalUnread})` : ""}`} />

        <div className="flex flex-1 min-h-0">
          {/* ── Left: Conversation list ── */}
          <div className={cn(
            "flex flex-col border-r border-gray-100 bg-white w-full sm:w-72 flex-shrink-0",
            mobileView === "chat" ? "hidden sm:flex" : "flex"
          )}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อลูกค้า..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-3">
                    <MessageCircle className="h-7 w-7 text-orange-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{search ? "ไม่พบลูกค้า" : "ยังไม่มีการสนทนา"}</p>
                </div>
              ) : (
                filteredConvs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConv(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50",
                      activeConvId === conv.id && "bg-orange-50 border-l-2 border-l-orange-500"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {conv.user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={conv.user.avatar} alt={conv.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-orange-600">{getInitials(conv.user.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700")}>
                          {conv.user.name}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                          {conv.messages[0] ? formatTime(conv.messages[0].createdAt) : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400")}>
                          {conv.messages[0] ? previewContent(conv.messages[0].content) : "เริ่มการสนทนา"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Right: Message thread ── */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0 bg-gray-50",
            mobileView === "list" ? "hidden sm:flex" : "flex"
          )}>
            {!activeConvId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                  <MessageCircle className="h-10 w-10 text-orange-300" />
                </div>
                <p className="text-base font-semibold text-gray-600">ยินดีต้อนรับสู่ Seller Chat</p>
                <p className="text-sm text-gray-400 mt-1">เลือกการสนทนาเพื่อตอบกลับลูกค้า</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => { setMobileView("list"); setActiveConvId(null); }} className="sm:hidden p-1.5 hover:bg-gray-100 rounded-lg mr-1 text-gray-600">←</button>
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {activeConv?.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeConv.user.avatar} alt={activeConv.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-orange-600">{getInitials(activeConv?.user.name ?? "?")}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{activeConv?.user.name}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1"><User className="h-2.5 w-2.5" /> ลูกค้า</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {loadingMsgs && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-sm text-gray-400">ยังไม่มีข้อความ</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      const content = parseContent(msg.content);
                      return (
                        <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {msg.sender.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={msg.sender.avatar} alt={msg.sender.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-orange-600">{getInitials(msg.sender.name)}</span>
                              )}
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5",
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
                  <div className="px-5 py-2 border-t border-gray-100 bg-orange-50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-orange-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-medium">รูปภาพที่เลือก</p>
                        <p className="text-[10px] text-gray-400">{imageFile?.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={sendImage} disabled={uploadingImage} className="flex items-center gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-60">
                          {uploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} ส่ง
                        </button>
                        <button onClick={() => { setImagePreview(null); setImageFile(null); }} className="text-xs text-gray-500 hover:text-red-500 px-2 py-1.5 rounded-lg">ยกเลิก</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product picker */}
                {showProductPicker && (
                  <div className="border-t border-gray-100 bg-white flex-shrink-0 max-h-56 flex flex-col">
                    <div className="flex items-center justify-between px-5 py-2 border-b border-gray-50">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-orange-500" /> แชร์สินค้า
                      </span>
                      <button onClick={() => setShowProductPicker(false)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="px-4 py-2 border-b border-gray-50">
                      <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="ค้นหาสินค้า..." className="w-full text-xs bg-gray-100 rounded-lg px-3 py-1.5 outline-none" autoFocus />
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {loadingProducts ? (
                        <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 text-gray-300 animate-spin" /></div>
                      ) : filteredProducts.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">ไม่พบสินค้า</p>
                      ) : (
                        filteredProducts.map((p) => (
                          <button key={p.id} onClick={() => sendProduct(p)} className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-orange-50 transition-colors text-left">
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

                {/* Input */}
                {!imagePreview && (
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <button onClick={() => imageInputRef.current?.click()} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors flex-shrink-0" title="แนบรูปภาพ">
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => { setShowProductPicker((v) => !v); if (!showProductPicker) loadShareProducts(); }}
                      className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0", showProductPicker ? "bg-orange-500 text-white" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50")}
                      title="แชร์สินค้า"
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="พิมพ์ข้อความตอบลูกค้า..."
                      className="flex-1 text-sm bg-gray-100 rounded-xl px-4 py-2.5 outline-none placeholder:text-gray-400 text-gray-800"
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || sending}
                      className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0", input.trim() && !sending ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed")}
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function SellerChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 text-gray-300 animate-spin" /></div>}>
      <SellerChatInner />
    </Suspense>
  );
}
