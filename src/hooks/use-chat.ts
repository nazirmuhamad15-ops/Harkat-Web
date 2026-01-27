import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  content: string
  sender: 'USER' | 'ADMIN' | 'SYSTEM'
  createdAt: string
  type?: 'text' | 'image' | 'product'
  status?: 'SENT' | 'DELIVERED' | 'READ'
  mediaUrl?: string
}

// Rate limiting config
const RATE_LIMIT_MAX = 5 // Max messages
const RATE_LIMIT_WINDOW = 60000 // Per minute (ms)

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  
  // Rate limiting
  const messageTimestamps = useRef<number[]>([])
  
  // Polling interval ref
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize or load chat
  useEffect(() => {
    const storedId = localStorage.getItem('harkat_chat_id')
    if (storedId) {
      setConversationId(storedId)
      fetchHistory(storedId)
    }
  }, [])

  // Poll for new messages when chat is open
  useEffect(() => {
    if (isOpen && conversationId) {
       startPolling()
    } else {
       stopPolling()
    }
    return () => stopPolling()
  }, [isOpen, conversationId])

  const startPolling = () => {
    stopPolling()
    pollInterval.current = setInterval(() => {
        if (conversationId) fetchHistory(conversationId, true)
    }, 3000) // Poll every 3 seconds
  }

  const stopPolling = () => {
    if (pollInterval.current) {
        clearInterval(pollInterval.current)
        pollInterval.current = null
    }
  }

  // Rate limit check
  const isRateLimited = (): boolean => {
    const now = Date.now()
    // Remove old timestamps outside the window
    messageTimestamps.current = messageTimestamps.current.filter(
      ts => now - ts < RATE_LIMIT_WINDOW
    )
    return messageTimestamps.current.length >= RATE_LIMIT_MAX
  }

  const fetchHistory = async (id: string, silent = false) => {
    try {
      const res = await fetch(`/api/chat/${id}`)
      if (res.ok) {
        const data = await res.json()
        // Deduplicate messages by ID to prevent React key errors
        const uniqueMessages = data.data.messages.reduce((acc: Message[], msg: Message) => {
          if (!acc.find(m => m.id === msg.id)) {
            acc.push(msg)
          }
          return acc
        }, [])
        setMessages(uniqueMessages)
      }
    } catch (error) {
      if (!silent) console.error('Failed to load chat history')
    }
  }

  const initChat = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/chat/init', { method: 'POST', body: JSON.stringify({}) })
      if (res.ok) {
        const data = await res.json()
        const newId = data.data.id
        setConversationId(newId)
        localStorage.setItem('harkat_chat_id', newId)
        return newId
      }
    } catch (error) {
      toast.error('Gagal memulai obrolan')
    } finally {
      setIsLoading(false)
    }
    return null
  }

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    // Rate limiting check
    if (isRateLimited()) {
      toast.error('Terlalu banyak pesan! Tunggu sebentar sebelum mengirim lagi.')
      return
    }

    let currentId = conversationId
    if (!currentId) {
       currentId = await initChat()
       if (!currentId) return
    }

    // Track this message for rate limiting
    messageTimestamps.current.push(Date.now())

    // Optimistic UI update
    const tempId = uuidv4()
    const optimisticMsg: Message = {
        id: tempId,
        content,
        sender: 'USER',
        createdAt: new Date().toISOString(),
        status: 'SENT'
    }
    setMessages(prev => [...prev, optimisticMsg])
    
    // Show typing indicator
    setIsTyping(true)
    
    try {
        const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId: currentId,
                content
            })
        })

        if (res.ok) {
            const data = await res.json()
            // Replace optimistic message with real one + bot reply if any
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempId)
                const newMsgs = [{ ...data.data.userMessage, status: 'DELIVERED' }]
                if (data.data.botReply) newMsgs.push(data.data.botReply)
                return [...filtered, ...newMsgs]
            })
        }
    } catch (error) {
        toast.error('Gagal mengirim pesan')
    } finally {
        setIsTyping(false)
    }
  }

  return {
    messages,
    isOpen,
    setIsOpen,
    isLoading,
    isTyping,
    sendMessage,
    conversationId
  }
}

