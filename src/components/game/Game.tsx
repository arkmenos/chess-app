import { Chess, Move, PieceSymbol, Square } from 'chess.js'
import { ReactElement, useEffect, useState } from "react"
import { Chessboard } from "react-chessboard"
import { socket } from "../socket/socket"
import { Player, PlayerInfo } from "../../types/Types"
import { v4 as uuidv4 } from "uuid"
import { BoardOrientation, Piece } from "react-chessboard/dist/chessboard/types"

interface gameProp {
    playerInfo: PlayerInfo
}

interface Message {
    name: string,
    text: string,
    time: Date
}

interface MoveInfo {
    from: Square,
    to: Square,
    promotion: PieceSymbol
}

function Game({playerInfo}: gameProp){
    const { name, roomId, type } = playerInfo
    const [ modType, setModType ] = useState(type)
    const [game, setGame] = useState(new Chess())
    const [messages, setMessages] = useState<ReactElement[]>([])
    const [moves, setMoves] = useState<ReactElement[]>([])
    const boardOrientation :BoardOrientation = type === Player.BLACK ? Player.BLACK : Player.WHITE
    const [isTurn, setIsTurn] = useState<boolean>(false)
    // const [moveCount, setMoveCount] = useState(0)
    const [userMessage, setUserMessage] = useState("")
    const [boardState, setBoardstate] = useState("start")
    
 
    const handleMessage = (data:Message ) => {
        const { name, text, } = data
        let message 
        if(name !== "Admin"){
            message = <li key={uuidv4()}><b>{name}:  </b>{text}</li>   
        }else{
            message = <li key={uuidv4()}><b>{text}</b></li>   
        }             
        setMessages([...messages, message])
    }

    socket.off('message')
    socket.on('message', (data) => handleMessage(data))

    const startGame = () => {
        const message = []
        message.push(<li>Game has Started</li>)
        if(modType === Player.WHITE){
            message.push(<li key={uuidv4()}>{name}'s turn</li>)
            setIsTurn(true)
        }
        setMessages([...messages, ...message])
    }

    socket.off('getBoardState')
    socket.on('getBoardState', (data) =>{
        setBoardstate(data.boardState)
        const gameCopy = game
        gameCopy.load(data.boardState)
        setGame(gameCopy)
    })
    
    socket.off('gameStart')
    socket.on('gameStart', () => startGame())
    

    socket.off('turnToSpectator')
    socket.on('turnToSpectator', () => {
        setModType(Player.SPECTATOR)
        const msg ={
            name: name,
            roomId: roomId,
            type: Player.SPECTATOR
        }
        socket.emit('enterRoom',msg )
        socket.emit('getBoardState', msg.roomId)
    })

    socket.off('inCheck')
    socket.on('inCheck', (data) => {
        const message =  <li key={uuidv4()}>{data}</li>                
        setMessages([...messages, message])
    })

    socket.off('isCheckMate')
    socket.on('isCheckMate', () => {
        const message =  <li key={uuidv4()}>Checkmate!!!</li>                
        setMessages([...messages, message])
    })

    socket.off('isDraw')
    socket.on('isDraw', () => {
        const message =  <li key={uuidv4()}>Game Over!! It's a draw</li>                
        setMessages([...messages, message])
    })

    socket.off('isStaleMate')
    socket.on('isStaleMate', () => {
        const message =  <li key={uuidv4()}>Game Over!!! It's a stalemate </li>                
        setMessages([...messages, message])
    })

    socket.off('isThreefoldRepetition')
    socket.on('isThreefoldRepetition', () => {
        const message =  <li key={uuidv4()}>Game Over!!! 3 Fold Repetition has occurred</li>                
        setMessages([...messages, message])
    })
    
    const opponentMove = (move: Move) => {
        console.log("Opponent move",move)
        const gameCopy =  game ;
        gameCopy.move(move);
        setGame(gameCopy);            
        setBoardstate(game.fen())

        if(game.isGameOver()){
            let whoWon;
            if(game.turn() === "b"){
                whoWon ="White won!!!"
            }
            else {
                whoWon = "Black won!!!"
            }
            const message =  <li key={uuidv4()}>Game Over!! {whoWon}</li>                
            setMessages([...messages, message])
            setIsTurn(false)
        }else if(modType !== Player.SPECTATOR){
            setIsTurn(true)
        } 

        const moveMsg = <li key={uuidv4()}>{gameCopy.moveNumber()}:  {move.piece}  {move.from}  {move.to}</li>
        setMoves([...moves,moveMsg])       
    }

    socket.off('turnOver')
    socket.on('turnOver', (data) => opponentMove(data))

    useEffect(() => {        

        const enterRoom = () => {
            const msg = {
                name: name,
                roomId: roomId,
                type: type
            }
            
            if(type === Player.WHITE){
                socket.emit('createRoom',msg )            
            }else if(type === Player.BLACK){
                socket.emit('enterRoom',msg )
            }else{
                socket.emit('enterRoom',msg )
                socket.emit('getBoardState', msg.roomId)
            }
        }

        socket.connect()
        enterRoom();      

        return () => {
        }
    },[])

    function makeAMove({from, to, promotion}: MoveInfo) {
        const gameCopy = game ;     
        const move = {
            from,
            to,
            promotion
        }
        let result = null
        try {
           result = gameCopy.move(move);
            setGame(gameCopy);
        }catch(err){
            const message = <li className='text-red-500'>{(err as Error).message ?? ""}</li>
            setMessages([...messages, message])
        }
        return result; // null if the move was illegal, the move object if the move was legal
    }
    
    function onDrop(sourceSquare: Square, targetSquare: Square, piece: Piece) {
        if((game.turn() === 'b' && modType === Player.WHITE) ||
            (game.turn() === 'w' && modType === Player.BLACK )){
            return false;
        }
        let p:PieceSymbol = "q"
        const ps = piece[1].toLowerCase() ?? "q"
        if(ps === ('p' || 'n' || 'b' || 'r' || 'q' || 'k')){
            console.log("PieceSymbol is working")
             p = ps
        }
        const move = makeAMove({
          from: sourceSquare,
          to: targetSquare,
          promotion: p
        });
    
        // illegal move
        if (move === null) return false; 
        
        if(game.inCheck()){
            socket.emit("inCheck")
        }
        if(game.isCheckmate()){
            socket.emit("isCheckmate")
        }
        if(game.isDraw()){
            socket.emit("isDraw")
        }
        if(game.isStalemate()){
            socket.emit("isStalemate")
        }
        if(game.isThreefoldRepetition()){
            socket.emit("isThreefoldRepetition")
        }
    
        if(game.isGameOver()){
            let whoWon;
            if(game.turn() === "b"){
                whoWon ="White won!!!"
            }
            else {
                whoWon = "Black won!!!"
            }
            const message =  <li key={uuidv4()}>Game Over!! {whoWon}</li>                
            setMessages([...messages, message])
        }
        const moveMsg = <li>{game.moveNumber()}.  {move.piece}  {move.to}  {move.from}</li>
        setMoves([...moves,moveMsg])
        setIsTurn(false)

        socket.emit("turnOver", move)
        socket.emit("boardState", { roomId: roomId, boardState: game.fen() })
        setBoardstate(game.fen())
        return true;
    }

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        socket.emit("message", userMessage )
        setUserMessage("")
    }

    return(
        <div className="grid  place-content-center  pt-10">
           <div className="grid lg:grid-cols-2 lg:grid-rows-2 ">
                <div className="lg:w-[600px] lg:h-[600px] place-content-center">
                    <Chessboard position={boardState} boardOrientation={boardOrientation} 
                        arePiecesDraggable={isTurn} onPieceDrop={onDrop} />
                </div>
                <div className="flex lg:place-content-center">
                    <div className="block lg:place-content-center w-[400px] lg:h-[520px] max-lg:pt-4 h[500px]">
                        <ul id="messageDisplay" key={uuidv4()}
                            className=" bg-slate-100 lg:h-[460px] sm:h-[260px] pl-4 overflow-y-auto scroll">
                            {messages}
                        </ul>                    
                        
                        <form className="pt-4 " onSubmit={(e)=>sendMessage(e)}>
                            <span>
                                <textarea  id="message" placeholder="Your message" value={userMessage}
                                    onChange={(e)=>setUserMessage(e.target.value)}
                                    className="w-full h-20 wrap resize-none border rounded-sm" required/><br/>
                            </span>
                            <div className="flex justify-end">
                                <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 
                                    px-4 rounded  " type="submit">Send</button>
                            </div>
                        </form>
                    </div>
                </div>
                <div>
                    <div className="w-[400px] h-[220px] lg:pt-8 max-lg:pt-4">
                        <ul id="movesDisplay" className=" bg-slate-100 h-[460px] pl-4 overflow-y-auto scroll"> 
                            {moves}                                                
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )}

export default Game