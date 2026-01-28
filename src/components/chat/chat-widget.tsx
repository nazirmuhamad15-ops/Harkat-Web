'use client'

import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageCircle, X, Send, Bot, Check, CheckCheck, Paperclip } from 'lucide-react'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'

import { useSession } from 'next-auth/react'

export function ChatWidget() {
  const { data: session, status } = useSession()
  const { isOpen, setIsOpen, messages, sendMessage, isLoading, isTyping } = useChat()
  const [inputValue, setInputValue] = React.useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const userScrolledRef = useRef(false)

  // Only auto-scroll when new messages arrive (not on every re-render)
  useEffect(() => {
    if (scrollRef.current && !userScrolledRef.current) {
      // Only scroll if message count increased (new message arrived)
      if (messages.length > prevMessageCountRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  // Auto-scroll when chat opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      userScrolledRef.current = false
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isOpen])

  // Detect user scrolling
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      // If user scrolled up more than 100px from bottom, mark as "user scrolled"
      userScrolledRef.current = scrollHeight - scrollTop - clientHeight > 100
    }
  }

  const handleSend = () => {
    if (!inputValue.trim()) return
    sendMessage(inputValue)
    setInputValue('')
  }

  // Only show chat widget for authenticated users
  if (status !== 'authenticated') return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="w-[350px] h-[500px] mb-4 shadow-xl border-gray-200 flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CardHeader className="bg-[#0058A3] text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-full">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <CardTitle className="text-base font-bold">Harkat Support</CardTitle>
                    <p className="text-xs text-blue-100 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Online
                    </p>
                </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 hover:text-white rounded-full h-8 w-8"
                aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-gray-50">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef} onScroll={handleScroll}>
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <p className="mb-2">Halo! 👋</p>
                        <p>Saya asisten virtual Harkat. Ada yang bisa saya bantu?</p>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            <button onClick={() => sendMessage('!status')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100 transition">📦 Cek Status</button>
                            <button onClick={() => sendMessage('Info promo terbaru')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100 transition">🏷️ Info Promo</button>
                            <button onClick={() => sendMessage('Hubungi Admin')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100 transition">👤 Hubungi Admin</button>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={cn(
                                "flex w-full mb-4",
                                msg.sender === 'USER' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                msg.sender === 'USER' 
                                    ? "bg-[#0058A3] text-white rounded-tr-none" 
                                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                            )}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <span className={cn(
                                    "text-[10px] flex items-center gap-1 mt-1",
                                    msg.sender === 'USER' ? "text-blue-200 justify-end" : "text-gray-400"
                                )}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.sender === 'USER' && (
                                        msg.status === 'READ' ? <CheckCheck className="w-3 h-3 text-blue-300" /> :
                                        msg.status === 'DELIVERED' ? <CheckCheck className="w-3 h-3" /> :
                                        <Check className="w-3 h-3" />
                                    )}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100">
                {/* Quick Actions - Always Visible */}
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                    <button onClick={() => sendMessage('!status')} className="text-xs bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 transition whitespace-nowrap">📦 Cek Status</button>
                    <button onClick={() => sendMessage('!menu')} className="text-xs bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 transition whitespace-nowrap">📋 Menu</button>
                    <button onClick={() => sendMessage('!admin')} className="text-xs bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 transition whitespace-nowrap">👤 Admin</button>
                </div>
                <form 
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                    }}
                    className="flex gap-2"
                >
                    <Input 
                        placeholder="Tulis pesan..." 
                        className="flex-1 border-gray-200 focus:ring-[#0058A3] rounded-full px-4"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                     <Button 
                        type="submit" 
                        size="icon" 
                        className="rounded-full bg-[#0058A3] hover:bg-[#004885] w-10 h-10 shrink-0"
                        disabled={!inputValue.trim()}
                        aria-label="Send message"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            isOpen ? "bg-red-500 hover:bg-red-600 rotate-90 scale-0 opacity-0 absolute" : "bg-[#0058A3] hover:bg-[#004885] scale-100 opacity-100"
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="w-7 h-7" />
      </Button>
      
      {/* Separate Open Button Animation fix */}
      {isOpen && (
          <Button
            onClick={() => setIsOpen(false)} 
            className="h-14 w-14 rounded-full shadow-lg bg-[#0058A3] hover:bg-[#004885] flex items-center justify-center"
            aria-label="Close chat"
          >
             <X className="w-7 h-7" />
          </Button>
      )}
    </div>
  )
}
