import { useState } from "react"
import Game from "../game/Game"
import { Player, PlayerInfo } from "../../types/Types"


function Home()
{
    const [, setPlayer] = useState<Player | null>(null)
    const [name, setName] = useState("")
    const [roomId, setRoomId] = useState("")
    const [errorMsg, setErrorMsg] = useState("")
    const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
    const [isSpectator, setIsSpectator] = useState<boolean>(false)
   
    const createRoomId = () => {
        const possibleDigits ="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let result = "";
        for(let i=0; i < 8; i++){
            const index = Math.floor(Math.random() * possibleDigits.length)
            result += possibleDigits[index]
        }
        return result
    }
    
    const onCreate = () => {
        if(name.length < 3) {
            setErrorMsg("Please enter a name with more than 2 characters")
        }else{
            const rmId = createRoomId()
            setRoomId(rmId)
            setPlayer(Player.WHITE)
            // createRoom()   
         
            setPlayerInfo({
                name: name,
                roomId: rmId,
                type: Player.WHITE
            })
            
        }
    }

    const onJoin = () => {
        if(name.length < 3) {
            setErrorMsg("Please enter a name with more than 2 characters")
        }
        else if(roomId.length < 1){
            setErrorMsg("Please enter a valid room id")
        }
        else{
            setPlayer(Player.BLACK)
            setPlayerInfo({
                name: name,
                roomId: roomId,
                type: isSpectator? Player.SPECTATOR : Player.BLACK
            })
        }

    }

    if(!playerInfo){
        return (
            <div className="flex flex-1 flex-wrap flex-row place-content-center h-full w-full 
                align-top ">
                <div className="h-[800px] w-[800px] place-content-center inline-block items-center bg-cyan-400 text-center ">
                    <h1 className="text-3xl font-bold">Create or Join a Chess Game</h1><br/>
                    
                    <label className="font-semibold">Name: </label>
                    <input type="text" className="ml-2 mr-4" placeholder="Enter your name" defaultValue={name} 
                        onChange={(e)=>setName(e.target.value)}/>
                    <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 
                        px-4 rounded" onClick={onCreate}>
                        Create</button><br/><br/>
                    <label className="font-semibold">Room: </label>
                    <input type="text" className="ml-2 mr-4" placeholder="Enter room id to join" defaultValue={roomId}
                        onChange={(e) => setRoomId(e.target.value)}/>
                    <input type="checkbox" className="mr-2 size-4" title="Join  Room as a spectator"
                        defaultChecked={isSpectator} onChange={(e) => setIsSpectator(e.target.checked) }
                        />
                    <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 
                        px-5 rounded w-[80px]"  onClick={onJoin}>Join</button> <br/><br/>
                    <div className=" inline-block align-text-bottom">
                        {errorMsg &&<p className="text-red-500 text-xl font-semibold w-full">{errorMsg}</p>}
                    </div>
                </div>
            </div>
        )
    }
    return(
        <Game playerInfo={playerInfo} />
    )
}

export default Home