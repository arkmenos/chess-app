import { Move, Piece } from "chess.js"

export enum Player {
    BLACK = "black",
    WHITE = "white",
    SPECTATOR = "spectator"
}

export interface PlayerInfo {
    name: string,
    roomId: string,
    type: Player
}

export interface Turn {
    move: Move,
    piece: Piece
}