import { io } from 'socket.io-client'


const URL = "https://chess-server-nkln.onrender.com:4000"

export const socket = io(URL, {
    autoConnect: false
})