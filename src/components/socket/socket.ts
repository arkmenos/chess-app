import { io } from 'socket.io-client'


const URL = import.meta.env.NODE_ENV === 'production' ? `${import.meta.env.URL}:${import.meta.env.PORT}` : 
    `${import.meta.env.LOCAL_URL}:${import.meta.env.PORT}`;

export const socket = io(URL, {
    autoConnect: false
})