import { create } from 'zustand'

const emptyContact = { username: "", id: "", country: "", unread: false }

const emptyAi = {
  username: "", id: "", country: "",
  transcriptinput: "", textoutput: "",
  isAiCallingOn: { instance: null, flag: false },
  unread: false
}

export const userStore = create((set) => ({
  username: "",
  id: "",
  customAccessToken: "",
  country: "",

  yourGlobalStarAiReference: emptyAi,

  availableConnectedUsers: {},   // { [id]: { id, username, country, unread } }
  unreadCount: 0,
  availableUsers: [],
  focusedContact: emptyContact,

  addContact: (user) => set((s) => {
    if (s.availableConnectedUsers[user.id]) return s
    return {
      availableConnectedUsers: {
        ...s.availableConnectedUsers,
        [user.id]: { id: user.id, username: user.username, country: user.country, unread: false }
      }
    }
  }),

  markUnread: (sender) => set((s) => {
    const ex = s.availableConnectedUsers[sender.id]
    if (ex?.unread) return s
    return {
      availableConnectedUsers: {
        ...s.availableConnectedUsers,
        [sender.id]: {
          id: sender.id,
          username: ex?.username ?? sender.username,
          country: ex?.country ?? sender.country,
          unread: true
        }
      },
      unreadCount: s.unreadCount + 1
    }
  }),

  markRead: (id) => set((s) => {
    const ex = s.availableConnectedUsers[id]
    if (!ex?.unread) return s
    return {
      availableConnectedUsers: { ...s.availableConnectedUsers, [id]: { ...ex, unread: false } },
      unreadCount: s.unreadCount - 1
    }
  }),

  setFocusedContact: (c) => set({ focusedContact: c }),
  clearFocusedContact: () => set({ focusedContact: emptyContact }),

  reset: () => set({
    username: "", id: "", customAccessToken: "", country: "",
    yourGlobalStarAiReference: emptyAi,
    availableConnectedUsers: {}, unreadCount: 0,
    availableUsers: [], focusedContact: emptyContact
  })
}))