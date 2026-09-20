import { create } from 'zustand'

export const chatStore = create((set) => ({
  sender: { username: "", id: "", country: "" },
  receiver: { username: "", id: "", country: "" },
  filesToBeSent: {},
  availableChats: [],
  starAiRecentChatContextStack: [],
  starAiRecentVoiceContextStack: [],
  chatsOverlay: false,

  setChatsOverlay: (value) => set({ chatsOverlay: value }),

  openChat: (sender, receiver, chats = []) =>
    set({ sender, receiver, availableChats: chats }),

  clearChat: () => set({
    receiver: { username: "", id: "", country: "" },
    availableChats: [],
    chatsOverlay: false
  })
}))