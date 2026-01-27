'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Bot, User, Send, Clock, MoreVertical, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  status: 'ai_active' | 'human_manual'
  lastMessageAt: string
  userId?: string
}

interface Message {
  id: string
  content: string
  sender: string
  createdAt: string
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Polling for conversations list
  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  // Poll active chat messages
  useEffect(() => {
    if (selectedChat) {
        fetchMessages(selectedChat)
        const interval = setInterval(() => fetchMessages(selectedChat, true), 3000)
        return () => clearInterval(interval)
    }
  }, [selectedChat])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchConversations = async () => {
    try {
        const res = await fetch('/api/admin/chat/conversations')
        if (res.ok) {
            const data = await res.json()
            setConversations(data.data)
        }
    } catch (e) { console.error(e) }
  }

  const fetchMessages = async (id: string, silent = false) => {
    if (!id) return
    try {
        const res = await fetch(`/api/chat/${id}`)
        if (res.ok) {
            const data = await res.json()
            setMessages(data.data.messages)
        }
    } catch (e) { console.error(e) }
  }

  const handleSend = async () => {
    if (!inputMsg.trim() || !selectedChat) return
    
    try {
        await fetch('/api/chat/send', {
            method: 'POST',
            body: JSON.stringify({
                conversationId: selectedChat,
                content: inputMsg,
                sender: 'ADMIN' // Explicitly marking as Admin
            })
        })
        setInputMsg('')
        fetchMessages(selectedChat, true)
    } catch (e) {
        console.error(e)
    }
  }

  const handleStatusChange = async (newStatus: 'ai_active' | 'human_manual') => {
    if (!selectedChat) return
    try {
        await fetch(`/api/chat/${selectedChat}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        })
        fetchConversations() // Refresh list to update badge
    } catch (e) { console.error(e) }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 p-6">
        {/* Sidebar List */}
        <Card className="w-1/3 flex flex-col">
            <CardHeader className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-xl">Inbuks Pesan</CardTitle>
                    <Button variant="ghost" size="icon" onClick={fetchConversations}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input placeholder="Cari percakapan..." className="pl-9" />
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Belum ada pesan</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {conversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => setSelectedChat(conv.id)}
                                className={cn(
                                    "p-4 cursor-pointer hover:bg-gray-50 transition flex items-start gap-3",
                                    selectedChat === conv.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                                )}
                            >
                                <div className="bg-gray-200 rounded-full p-2">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-semibold text-sm truncate">
                                            {conv.userId ? 'Member' : 'Guest User'}
                                            <span className="ml-2 text-xs text-gray-400 font-normal">#{conv.id.slice(0,4)}</span>
                                        </h4>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {conv.status === 'ai_active' ? (
                                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 bg-blue-100 text-blue-700 hover:bg-blue-100">Bot Active</Badge>
                                        ) : (
                                            <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">Needs Human</Badge>
                                        )}
                                        <p className="text-xs text-gray-500 truncate flex-1">
                                            Click to view messages...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="flex-1 flex flex-col">
            {!selectedChat ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Bot className="w-16 h-16 mb-4 opacity-20" />
                    <p>Pilih percakapan untuk memulai chat</p>
                </div>
            ) : (
                <>
                    <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="bg-blue-100 p-2 rounded-full">
                                <User className="w-5 h-5 text-blue-700" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Percakapan #{selectedChat.slice(0,8)}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    {conversations.find(c => c.id === selectedChat)?.status === 'ai_active' ? (
                                         <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            <span className="text-xs text-gray-500">Bot Mode</span>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => handleStatusChange('human_manual')}>Ambil Alih</Button>
                                         </div>
                                    ) : (
                                         <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            <span className="text-xs text-gray-500">Human Active</span>
                                         </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleStatusChange('ai_active')}
                        >
                            Tandai Selesai (Kembali ke Bot)
                        </Button>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                            {messages.map((msg) => (
                                <div 
                                    key={msg.id} 
                                    className={cn(
                                        "flex w-full",
                                        msg.sender === 'ADMIN' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[70%] rounded-xl px-4 py-3 text-sm shadow-sm",
                                        msg.sender === 'ADMIN' 
                                            ? "bg-blue-600 text-white rounded-tr-none" 
                                            : msg.sender === 'SYSTEM'
                                                ? "bg-gray-200 text-gray-600 text-xs italic border border-gray-300 mx-auto"
                                                : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                                    )}>
                                        {msg.sender === 'SYSTEM' && <span className="font-bold block mb-1">🤖 Bot:</span>}
                                        <p>{msg.content}</p>
                                        <span className={cn(
                                            "text-[10px] block mt-1 opacity-70",
                                            msg.sender === 'ADMIN' ? "text-right" : ""
                                        )}>
                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-white border-t">
                            <form 
                                className="flex gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSend()
                                }}
                            >
                                <Input 
                                    placeholder="Ketik balasan..." 
                                    value={inputMsg}
                                    onChange={(e) => setInputMsg(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={!inputMsg.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </>
            )}
        </Card>
    </div>
  )
}
