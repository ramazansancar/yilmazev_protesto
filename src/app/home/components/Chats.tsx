"use client"

import { addMessage } from "@/actions/messages"
import { db } from "@/config/firebase"
import IconSend from "@/icons/send.svg"
import IconSpinner from "@/icons/spinner.svg"
import { IMessage } from "@/types/IMessage"
import clsx from "clsx"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { useEffect, useRef, useState } from "react"
import { useUsername } from "../../../hooks/useUsername"

const Bubble = ({ isMe, sender, message }: { isMe: boolean; sender: string; message: string }) => {
  return (
    <div className={clsx(isMe && "justify-items-end self-end")}>
      <div className={clsx("w-fit rounded-3xl px-4 py-3", isMe ? "rounded-br-sm bg-primary" : "rounded-bl-sm bg-fiord")}>
        <p className="break-words text-[15px]">{message}</p>
      </div>
      <span className={clsx("block w-full text-[13px] text-gray", isMe && "text-right")}>{sender}</span>
    </div>
  )
}

const Chat = () => {
  const username = useUsername()
  const [ messages, setMessages ] = useState<IMessage[]>([])
  const [ newMessage, setNewMessage ] = useState("")
  const [ isLoading, setIsLoading ] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!username) return

    setIsLoading(true)

    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as IMessage[]

      setMessages(messages)
      setIsLoading(false)
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    })

    return () => unsubscribe()
  }, [ username ])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !username) return

    await addMessage(username, newMessage)
    setNewMessage("")
  }

  return (
    <div className="flex w-full flex-col rounded-2xl border border-spruce lg:min-w-96 lg:max-w-96">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-extrabold">Topluluk Sohbeti</h1>
      </div>
      <div className="h-full flex-1 overflow-hidden px-4 py-3">
        {isLoading ? (
          <div className="flex size-full items-center justify-center">
            <IconSpinner className="size-[26px] animate-spin" />
          </div>
        ) : (
          <div ref={chatContainerRef} className="flex h-full !max-h-80 min-h-full flex-col gap-6 overflow-y-auto lg:h-auto">
            {messages.map((msg) => (
              <Bubble key={msg.id} isMe={msg.username === username} sender={msg.username} message={msg.message} />
            ))}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="border-t border-spruce">
          <div className="mx-3 my-1 flex min-h-11 items-center gap-1 rounded-2xl bg-stone p-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Aa"
              className="flex-1 bg-transparent px-3 py-1 placeholder:text-gray focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="flex size-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-primary/10 active:bg-primary/20 disabled:opacity-50 disabled:hover:bg-primary/0 disabled:active:bg-primary/0"
            >
              <IconSend className="size-5 text-primary" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Chat
