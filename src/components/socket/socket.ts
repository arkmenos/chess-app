import { io } from 'socket.io-client'


const URL = "https://chess-server-nkln.onrender.com"

export const socket = io(URL, {
    autoConnect: false
})