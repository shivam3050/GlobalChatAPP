import { create } from 'zustand'
import { userStore } from './userStore';



export const socketStore = create((set, get) => ({

    socket: null,

    initSocket: () => {
        try {
            const { username: username, country: country } = userStore.getState();

            const socket = new WebSocket(`${import.meta.env.VITE_BACKEND_WS_URL}/?username=${username}&country=${encodeURIComponent(country)}`);
            socket.binaryType = "arraybuffer";
            set({ socket: socket });
            socket.onopen = () => { } // abstract
            socket.onclose = (event) => { } // abstract
            socket.onerror = (event) => { } // abstract
            socket.onmessage = async (message) => { } // abstract

            return true

        } catch (error) {

            return false
        }
    },


    isActive: () => {
        const ws = get().socket;
        return Boolean(ws && ws.readyState === WebSocket.OPEN);
    }
}))