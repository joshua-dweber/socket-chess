import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import '../css/buttons.css';
export default ({setCookies}) => {
    const [socket] = useState(() => io(':9000'));
    const [name, setName] = useState("");
    const [games, setGames] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:9000/api/game/getGames', {})
            .then(res => setGames(res.data))

        socket.on('refresh', () => {
            axios.get('http://localhost:9000/api/game/getGames', {})
                .then(res => setGames(res.data))
        });

        return () => socket.disconnect(true);
    }, []);

    const clickHandler = (num, id) => {
        axios.post('http://localhost:9000/api/users/join', {num: num, _id: id}).then(res => {
            socket.emit("refreshPage");
            console.log(res);
            setCookies(num, id);
        })        
    }

    const createButton = () => [
        axios.post('http://localhost:9000/api/game/create', { name })
            .then(res => {
                socket.emit("refreshPage");
                axios.get('http://localhost:9000/api/game/getGames', {})
                    .then(res => setGames(res.data))
            })
    ]
    return (
        <>
            <h1>Available Games:</h1>
            {
                games.map(game => {
                    if(game.user2 && game.user1)
                        return "";
                    else
                        return (
                            <>
                            <h3>{ game.name }</h3>
                            { !game.user1 ? <button onClick={() => clickHandler(1, game._id)}>User 1</button> : "" }
                            { !game.user2 ? <button onClick={() => clickHandler(2, game._id)}>User 2</button> : "" }
                            </>
                        )
                })
            }
            <br/>
            <input type="text" onChange={e => setName(e.target.value)}/><button onClick={() => createButton()}>Create New Game</button>
        </>
    )
}