import { useEffect, useRef, useState, useCallback } from 'react'
import { Client, type StompSubscription } from '@stomp/stompjs'
import type { MessageDto, TypingEvent, ReadReceiptEvent, ConversationSummary } from '@/types/chat'

export interface UseChatSocketOptions {
  userId?: string | null
  activeConversationId?: string | null
  onMessageReceived?: (message: MessageDto) => void
  onTypingReceived?: (event: TypingEvent) => void
  onReadReceiptReceived?: (event: ReadReceiptEvent) => void
  onConversationReceived?: (conversation: ConversationSummary) => void
}

export function useChatSocket({
  userId,
  activeConversationId,
  onMessageReceived,
  onTypingReceived,
  onReadReceiptReceived,
  onConversationReceived,
}: UseChatSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const conversationSubRef = useRef<StompSubscription | null>(null)
  const typingSubRef = useRef<StompSubscription | null>(null)
  const processedMessageIdsRef = useRef<Set<string>>(new Set())

  // Lưu callbacks vào ref để tránh re-subscribe không cần thiết khi handler thay đổi
  const onMessageRef = useRef(onMessageReceived)
  const onTypingRef = useRef(onTypingReceived)
  const onReadRef = useRef(onReadReceiptReceived)
  const onConvRef = useRef(onConversationReceived)

  useEffect(() => {
    onMessageRef.current = onMessageReceived
    onTypingRef.current = onTypingReceived
    onReadRef.current = onReadReceiptReceived
    onConvRef.current = onConversationReceived
  })

  // Hàm xử lý và loại bỏ sự kiện tin nhắn trùng lặp từ nhiều kênh
  const processIncomingMessage = useCallback((stompMessage: { body: string }) => {
    try {
      const data: MessageDto = JSON.parse(stompMessage.body)
      if (!data?.id) return

      if (processedMessageIdsRef.current.has(data.id)) {
        return
      }
      processedMessageIdsRef.current.add(data.id)
      if (processedMessageIdsRef.current.size > 200) {
        const first = processedMessageIdsRef.current.values().next().value
        if (first) processedMessageIdsRef.current.delete(first)
      }

      onMessageRef.current?.(data)
    } catch (err) {
      console.error('Lỗi phân tích tin nhắn WebSocket:', err)
    }
  }, [])

  // Khởi tạo kết nối STOMP
  useEffect(() => {
    if (!userId) {
      if (clientRef.current) {
        clientRef.current.deactivate()
        clientRef.current = null
        setIsConnected(false)
      }
      return
    }

    // Xác định WebSocket URL
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const wsProtocol = isHttps ? 'wss:' : 'ws:'
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost'
    const brokerUrl = `${wsProtocol}//${host}:8080/ws/chat?userId=${encodeURIComponent(userId)}`

    const client = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true)

        // 1. Nhận thông báo cuộc hội thoại mới được tạo (cả user queue và topic user cá nhân)
        const handleConvMsg = (stompMessage: { body: string }) => {
          try {
            const data: ConversationSummary = JSON.parse(stompMessage.body)
            onConvRef.current?.(data)
          } catch (err) {
            console.error('Lỗi phân tích cuộc hội thoại WebSocket:', err)
          }
        }
        client.subscribe('/user/queue/conversations', handleConvMsg)
        client.subscribe(`/topic/users/${userId}/conversations`, handleConvMsg)

        // 2. Đăng ký nhận tin nhắn cá nhân ở mọi phòng chat (hỗ trợ cả 2 kênh để đảm bảo 100% nhận được)
        client.subscribe('/user/queue/messages', processIncomingMessage)
        client.subscribe(`/topic/users/${userId}/messages`, processIncomingMessage)

        // 3. Đăng ký nhận sự kiện đã xem tin nhắn
        client.subscribe('/user/queue/read-receipts', (stompMessage) => {
          try {
            const data: ReadReceiptEvent = JSON.parse(stompMessage.body)
            onReadRef.current?.(data)
          } catch (err) {
            console.error('Lỗi phân tích /user/queue/read-receipts:', err)
          }
        })

        // 4. Nếu đã có activeConversationId thì subscribe luôn
        if (activeConversationId) {
          subscribeToConversation(client, activeConversationId)
        }
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.warn('STOMP error:', frame.headers['message'])
      },
      onWebSocketError: () => {
        // Im lặng để không làm spam console khi backend chat chưa bật
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [userId])

  // Hàm subscribe vào topic của cuộc trò chuyện đang mở
  const subscribeToConversation = useCallback((client: Client, convId: string) => {
    // Huỷ đăng ký phòng cũ nếu có
    if (conversationSubRef.current) {
      conversationSubRef.current.unsubscribe()
      conversationSubRef.current = null
    }
    if (typingSubRef.current) {
      typingSubRef.current.unsubscribe()
      typingSubRef.current = null
    }

    // 1. Topic tin nhắn phòng (dùng chung processIncomingMessage để loại bỏ trùng lặp)
    conversationSubRef.current = client.subscribe(
      `/topic/conversations/${convId}`,
      processIncomingMessage,
    )

    // 2. Topic đang gõ (typing indicator)
    typingSubRef.current = client.subscribe(
      `/topic/conversations/${convId}/typing`,
      (stompMessage) => {
        try {
          const data: TypingEvent = JSON.parse(stompMessage.body)
          onTypingRef.current?.(data)
        } catch (err) {
          console.error('Lỗi phân tích typing event:', err)
        }
      },
    )
  }, [processIncomingMessage])

  // Theo dõi activeConversationId thay đổi
  useEffect(() => {
    if (!clientRef.current || !clientRef.current.connected) return

    if (activeConversationId) {
      subscribeToConversation(clientRef.current, activeConversationId)
    } else {
      if (conversationSubRef.current) {
        conversationSubRef.current.unsubscribe()
        conversationSubRef.current = null
      }
      if (typingSubRef.current) {
        typingSubRef.current.unsubscribe()
        typingSubRef.current = null
      }
    }
  }, [activeConversationId, subscribeToConversation])

  // Gửi tin nhắn qua STOMP
  const sendMessage = useCallback(
    (conversationId: string, content: string): boolean => {
      if (!clientRef.current || !clientRef.current.connected) {
        return false
      }
      clientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          conversationId,
          content,
        }),
      })
      return true
    },
    [],
  )

  // Gửi sự kiện đang soạn tin nhắn (typing)
  const sendTyping = useCallback(
    (conversationId: string, typing: boolean) => {
      if (!clientRef.current || !clientRef.current.connected) return
      clientRef.current.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          conversationId,
          typing,
        }),
      })
    },
    [],
  )

  // Gửi sự kiện đã xem tin nhắn
  const sendRead = useCallback((messageId: string, conversationId?: string) => {
    if (!clientRef.current || !clientRef.current.connected || !messageId) return
    clientRef.current.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({
        messageId,
        conversationId,
      }),
    })
  }, [])

  return {
    isConnected,
    sendMessage,
    sendTyping,
    sendRead,
  }
}
