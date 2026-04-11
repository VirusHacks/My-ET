'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, Bot, User,
  Loader2, Sparkles, ChevronRight, Maximize2, Minimize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ArticleChatProps {
  articleTitle: string
  articleContent: string
}

export function ArticleChat({ articleTitle, articleContent }: ArticleChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your AI assistant for this article. Ask me anything about "${articleTitle}".` }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/article/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(1), // omit initial greeting
          articleContext: { title: articleTitle, content: articleContent }
        })
      })

      if (!res.ok) throw new Error('Failed to fetch response')
      const data = await res.json() as { answer: string }
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I ran into an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* ── Floating Toggle Button (Bottom Left) ── */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-[60] h-12 px-5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 gap-2 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-semibold">Chat with AI</span>
      </Button>

      {/* ── Chat Drawer (Slide from Left) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[2px]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-[80] w-full max-w-[400px] bg-background border-r border-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">AI Assistant</h3>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Online · GPT-4o</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-xl w-8 h-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                          : 'bg-muted text-foreground rounded-tl-none border border-border/40'
                      }`}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-none border border-border/40 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Footer */}
              <div className="p-4 border-t border-border/40 bg-background">
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about the article..."
                    className="flex-1 rounded-2xl h-11 pr-12 focus-visible:ring-primary/20 transition-all border-border/80"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-1.5 h-8 w-8 rounded-xl shrink-0"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
                <div className="flex items-center justify-center gap-1 mt-3">
                  <Sparkles className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">Explain patterns, clarify terms, or summarize.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
