import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { withCookies } from 'react-cookie';

import blackking from '../images/blackking.png';
import blackpawn from '../images/blackpawn.png';
import blackknight from '../images/blackknight.png';
import blackqueen from '../images/blackqueen.png';
import blackbishop from '../images/blackbishop.png';
import blackrook from '../images/blackrook.png';
import whiteking from '../images/whiteking.png';
import whitepawn from '../images/whitepawn.png';
import whiteknight from '../images/whiteknight.png';
import whitequeen from '../images/whitequeen.png';
import whitebishop from '../images/whitebishop.png';
import whiterook from '../images/whiterook.png';

export default withCookies(({reset, cookies}) => {

    const [socket] = useState(() => io(':9000'));
    const [images, setImages] = useState({});
    const [selected, setSelected] = useState({"pos": "", "name": "", "color": ""});
    const [yourTurn, setYourTurn] = useState(false);
    const [inCheck, setInCheck] = useState(false);
    const [winState, setWinState] = useState(0);
    const [available, setAvailable] = useState([]);
    const [pieces, setPieces] = useState({});
    const [opponentPieces, setOpponentPieces] = useState({});
    const [board, setBoard] = useState([
        [{}, {}, {}, {}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}, {}, {}, {}]]);

    useEffect(() => {
        setImages({
            blackking: blackking,
            blackpawn: blackpawn,
            blackknight: blackknight,
            blackqueen: blackqueen,
            blackbishop: blackbishop,
            blackrook: blackrook,
            whiteking: whiteking,
            whitepawn: whitepawn,
            whiteknight: whiteknight,
            whitequeen: whitequeen,
            whitebishop: whitebishop,
            whiterook: whiterook
        })

        axios.post('http://localhost:9000/api/game/getPieces', {_id: cookies.cookies.currentId})
            .then(res => {
                console.log(res);
                setPieces(res.data[`pieces${cookies.cookies.currentUser}`]);
                let opponentId = cookies.cookies.currentUser == 1 ? 2 : 1;
                setOpponentPieces(convertToOpponent(res.data[`pieces${opponentId}`]));
                setYourTurn(res.data.currentTurn == cookies.cookies.currentUser);
            }).catch(err => console.log(err))

        socket.on('opponentMove', data => {
            if(data._id == cookies.cookies.currentId) {
                setOpponentPieces(convertToOpponent(data.pieces));
                setYourTurn(true);
            }
        });

        socket.on('opponentAttack', data => {
            if (data._id == cookies.cookies.currentId) {
                setOpponentPieces(convertToOpponent(data.pieces));
                setPieces(convertToOpponent(data.opponentPieces));
                setYourTurn(true);
            }
        });

        socket.on('opponentWon', data => {
            if (data._id == cookies.cookies.currentId) {
                setWinState(-1);
            }
        });

        socket.on('opponentCheck', data => {
            if (data._id == cookies.cookies.currentId) {
                setInCheck(data.check);
            }
        });

        socket.on('userReset', data => {
            if (data._id == cookies.cookies.currentId) {
                reset();
            }
        });

        return () => socket.disconnect(true);
    }, []);

    useEffect(() => {
        board.forEach((val, idx1) => {
            board[idx1].forEach((val, idx2) => {
                board[idx1][idx2] = {};
                if (available.includes(`${idx2 + 1},${idx1 + 1}`)) {
                    board[idx1][idx2] = {available: true};
                }
            });
        });
        Object.entries(pieces).forEach(([key, val]) => {
            let [x, y] = val.split(",");
            board[y - 1][x - 1] = { "name": key, "color": cookies.cookies.currentUser == 1 ? "white" : "black", "selected": val == selected.pos, available: board[y - 1][x - 1].available};
        });
        Object.entries(opponentPieces).forEach(([key, val]) => {
            let [x, y] = val.split(",");
            board[y - 1][x - 1] = { "name": key, "color": cookies.cookies.currentUser == 1 ? "black" : "white", available: board[y - 1][x - 1].available};
        });
        setBoard([...board]);
    }, [pieces, opponentPieces, selected]);

    const convertToOpponent = piecesObj => Object.fromEntries(Object.entries(piecesObj).map(([key, val]) => [key, `${9 - val.split(",")[0]},${9 - val.split(",")[1]}`]));
    const convertToOpponentArr = arr => arr.map(val => `${9 - val.split(",")[0]},${9 - val.split(",")[1]}`);

    const resetGame = () => {
        axios.post('http://localhost:9000/api/game/deleteGame', { _id: cookies.cookies.currentId })
            .then(res => {
                console.log(res);
                socket.emit("reset", {_id: cookies.cookies.currentId})
                socket.emit("refreshPage")
                reset();
            })
    }

    const movePiece = (clickedKey, pos, color) => {
        if(yourTurn) {
            let pieceFound = false;
            if(selected.name.startsWith("king") && clickedKey.startsWith("rook") && selected.color == color) {
                if(castling(selected.name, clickedKey)) return;
            }
            if(Object.values(pieces).includes(pos)) {
                pieceFound = true;
                let moveset = checkMoves(clickedKey);
                setAvailable(moveset);
                setSelected({ "pos": pieces[clickedKey] ? pieces[clickedKey] : "", "name": clickedKey, "color": color ? color : "" });
            }
            if(!pieceFound) {
                if(selected.pos != "") {
                    let moveset = checkMoves(selected.name);
                    if(moveset.includes(pos)) {
                        if((color == "black" && cookies.cookies.currentUser == 1) || (color == "white" && cookies.cookies.currentUser == 2)) {
                            if(selected.pos != "") {
                                let canMove = true;
                                if (selected.name.startsWith("king"))
                                    canMove = checkCheck(2, pos);
                                if(canMove) {
                                    pieces[selected.name] = pos;
                                    let opponentKey = Object.keys(opponentPieces).find(key => opponentPieces[key] == pos);
                                    delete opponentPieces[opponentKey];
                                    if (opponentKey == "king1") {
                                        setWinState(1);
                                        socket.emit("won", { _id: cookies.cookies.currentId });
                                    }
                                    setPieces({ ...pieces });
                                    setOpponentPieces({ ...opponentPieces });
                                    axios.put('http://localhost:9000/api/game/attackPieces', { userId: cookies.cookies.currentUser, oppId: cookies.cookies.currentUser == 1 ? 2 : 1, pieces: pieces, oppPieces: opponentPieces, _id: cookies.cookies.currentId })
                                        .then(res => console.log(res))
                                    setInCheck(false);
                                    socket.emit("attack", { pieces: pieces, opponentPieces: opponentPieces, _id: cookies.cookies.currentId });
                                    if (selected.name.startsWith("pawn") && pos.split(',')[1] == 1) {
                                        pawnAscension(selected.name);
                                    }
                                    checkCheck(1);
                                    setAvailable([]);
                                    setSelected({ "pos": "", "name": "", "color": "" });
                                    setYourTurn(false);
                                } else
                                    setAvailable([]);
                            }
                        } else {
                            if ((selected.color == "black" && cookies.cookies.currentUser == 2) || (selected.color == "white" && cookies.cookies.currentUser == 1)) {
                                let canMove = true;
                                if (selected.name.startsWith("king"))
                                    canMove = checkCheck(2, pos);
                                if (canMove) {
                                    pieces[selected.name] = pos;
                                    setPieces({...pieces});
                                    axios.put('http://localhost:9000/api/game/updatePieces', { userId: cookies.cookies.currentUser, pieces: pieces, _id: cookies.cookies.currentId})
                                        .then(res => console.log(res))
                                    socket.emit("move", { pieces: pieces, _id: cookies.cookies.currentId });
                                    if (selected.name.startsWith("pawn") && pos.split(',')[1] == 1) {
                                        pawnAscension(selected.name);
                                    }
                                    setInCheck(false);
                                    setAvailable([]);
                                    checkCheck(1);
                                    setYourTurn(false);
                                } else
                                    setAvailable([]);
                            }
                            setSelected({ "pos": "", "name": "", "color": "" });
                        }
                    }
                } else {
                    setSelected({ "pos": pieces[clickedKey] ? pieces[clickedKey] : "", "name": clickedKey, "color": color ? color : "" });
                }
            }
        }
    }

    const checkCheck = (type, pos="") => {
        if(type == 1) {
            let totalMoveset = [];
            Object.keys(pieces).forEach(key => {
                totalMoveset = [...totalMoveset, ...checkMoves(key)];
            });
            if (totalMoveset.includes(opponentPieces.king1)) {
                console.log("in check");
                socket.emit("check", { check: true, _id: cookies.cookies.currentId });
            } else {
                socket.emit("check", { check: false, _id: cookies.cookies.currentId });
            }
        } else if (type == 2) {
            let totalMoveset = [];
            Object.keys(opponentPieces).forEach(key => {
                totalMoveset = [...totalMoveset, ...checkMoves(key, true)];
            });
            if (totalMoveset.includes(pos)) {
                console.log("can't do that because of check");
                return false;
            } else {
                return true;
            }
        }
    }

    const checkMoves = (piece, opp=false) => {
        let localPieces, localOppPieces;
        if(opp) {
            localPieces = JSON.parse(JSON.stringify(convertToOpponent(opponentPieces)));
            localOppPieces = convertToOpponent(pieces);
        } else {
            localPieces = JSON.parse(JSON.stringify(pieces));
            localOppPieces = opponentPieces;
        }
        let pieceMoveset = piece.slice(0, piece.length - 1);
        let availableMoves = [];
        let [x, y] = localPieces[piece].split(',');
        localPieces[piece] = "";
        x = Number(x);
        y = Number(y);
        if (pieceMoveset == "pawn") {
            if (!opp) {
                if (y == 7 && !Object.values(localOppPieces).includes(`${x},${y - 2}`) && !Object.values(localOppPieces).includes(`${x},${y - 1}`) && !Object.values(localPieces).includes(`${x},${y - 1}`))
                    availableMoves.push(`${x},5`);
                if (!Object.values(localOppPieces).includes(`${x},${y - 1}`) && !Object.values(localPieces).includes(`${x},${y - 1}`))
                    availableMoves.push(`${x},${y - 1}`);
            }
            if (Object.values(localOppPieces).includes(`${x - 1},${y - 1}`))
                availableMoves.push(`${x - 1},${y - 1}`);
            if (Object.values(localOppPieces).includes(`${x + 1},${y - 1}`))
                availableMoves.push(`${x + 1},${y - 1}`);
        }
        if (pieceMoveset == "rook") {
            for (let i = 1; i < y; i++) {
                if (!Object.values(localOppPieces).includes(`${x},${y - i + 1}`) && !Object.values(localPieces).includes(`${x},${y - i}`))
                    availableMoves.push(`${x},${y - i}`);
                else break;
            }
            for (let i = y + 1; i <= 8; i++) {
                if (!Object.values(localOppPieces).includes(`${x},${i - 1}`) && !Object.values(localPieces).includes(`${x},${i}`))
                    availableMoves.push(`${x},${i}`);
                else break;
            }
            for (let i = 1; i < x; i++) {
                if (!Object.values(localOppPieces).includes(`${x - i + 1},${y}`) && !Object.values(localPieces).includes(`${x - i},${y}`))
                    availableMoves.push(`${x - i},${y}`);
                else break;
            }
            for (let i = x + 1; i <= 8; i++) {
                if (!Object.values(localOppPieces).includes(`${i - 1},${y}`) && !Object.values(localPieces).includes(`${i},${y}`))
                    availableMoves.push(`${i},${y}`);
                else break;
            }
        }
        if (pieceMoveset == "bishop") {
            let j = 1, i = 1;
            while (i < y && j < x) {
                if (!Object.values(localOppPieces).includes(`${x - j + 1},${y - i + 1}`) && !Object.values(localPieces).includes(`${x - j},${y - i }`))
                    availableMoves.push(`${x - j},${y - i}`)
                else break;
                j++;
                i++;
            }
            j = x + 1;
            i = 1;
            while (i < y && j <= 8) {
                if (!Object.values(localOppPieces).includes(`${j - 1},${y - i + 1}`) && !Object.values(localPieces).includes(`${j},${y - i}`))
                    availableMoves.push(`${j},${y - i}`)
                else break;
                j++;
                i++;
            }
            j = 1;
            i = y + 1
            while (i <= 8 && j < x) {
                if (!Object.values(localOppPieces).includes(`${x - j + 1},${i - 1}`) && !Object.values(localPieces).includes(`${x - j},${i}`))
                    availableMoves.push(`${x - j},${i}`)
                else break;
                j++;
                i++;
            }
            j = x + 1;
            i = y + 1;
            while (i <= 8 && j <= 8) {
                if (!Object.values(localOppPieces).includes(`${j - 1},${i - 1}`) && !Object.values(localPieces).includes(`${j},${i}`))
                    availableMoves.push(`${j},${i}`)
                else break;
                j++;
                i++;
            }
        }
        if (pieceMoveset == "king") {
            if (!Object.values(localPieces).includes(`${x},${y + 1}`))
                availableMoves.push(`${x},${y + 1}`);
            if (!Object.values(localPieces).includes(`${x},${y - 1}`))
                availableMoves.push(`${x},${y - 1}`);
            if (!Object.values(localPieces).includes(`${x - 1},${y}`))
                availableMoves.push(`${x - 1},${y}`);
            if (!Object.values(localPieces).includes(`${x + 1},${y}`))
                availableMoves.push(`${x + 1},${y}`);
            if (!Object.values(localPieces).includes(`${x + 1},${y + 1}`))
                availableMoves.push(`${x + 1},${y + 1}`);
            if (!Object.values(localPieces).includes(`${x + 1},${y - 1}`))
                availableMoves.push(`${x + 1},${y - 1}`);
            if (!Object.values(localPieces).includes(`${x - 1},${y + 1}`))
                availableMoves.push(`${x - 1},${y + 1}`);
            if (!Object.values(localPieces).includes(`${x - 1},${y - 1}`))
                availableMoves.push(`${x - 1},${y - 1}`);
            for(let i = 1; i <= 2; i++) {
                if (y != "8" || localPieces[`rook${i}`].split(',')[1] != "8")
                    break;
                if ((x != "5" && cookies.cookies.currentUser == 2) || (x != "4" && cookies.cookies.currentUser == 1))
                    break;
                if (x > localPieces[`rook${i}`].split(',')[0]) {
                    if (!Object.values(localPieces).includes("2,8") && !Object.values(localPieces).includes("3,8") && (cookies.cookies.currentUser == 2 ? !Object.values(localPieces).includes("4,8") : true)) {
                        if (cookies.cookies.currentUser != 2) {
                            availableMoves.push("1,8");
                        } else {
                            availableMoves.push("1,8");
                        }
                    }
                } else {
                    if (!Object.values(localPieces).includes("6,8") && !Object.values(localPieces).includes("7,8") && (cookies.cookies.currentUser == 1 ? !Object.values(localPieces).includes("5,8") : true)) {
                        if (cookies.cookies.currentUser != 2) {
                            availableMoves.push("8,8");
                        } else {
                            availableMoves.push("8,8");
                        }
                    }
                }
            }
        }
        if (pieceMoveset == "queen") {
            let j = 1, i = 1;
            while (i < y && j < x) {
                if (!Object.values(localOppPieces).includes(`${x - j + 1},${y - i + 1}`) && !Object.values(localPieces).includes(`${x - j},${y - i}`))
                    availableMoves.push(`${x - j},${y - i}`)
                else break;
                j++;
                i++;
            }
            j = x + 1;
            i = 1;
            while (i < y && j <= 8) {
                if (!Object.values(localOppPieces).includes(`${j - 1},${y - i}`) && !Object.values(localPieces).includes(`${j},${y - i}`))
                    availableMoves.push(`${j},${y - i}`)
                else break;
                j++;
                i++;
            }
            j = 1;
            i = y + 1
            while (i <= 8 && j < x) {
                if (!Object.values(localOppPieces).includes(`${x - j + 1},${i - 1}`) && !Object.values(localPieces).includes(`${x - j},${i}`))
                    availableMoves.push(`${x - j},${i}`)
                else break;
                j++;
                i++;
            }
            j = x + 1;
            i = y + 1;
            while (i <= 8 && j <= 8) {
                if (!Object.values(localOppPieces).includes(`${j - 1},${i - 1}`) && !Object.values(localPieces).includes(`${j},${i}`))
                    availableMoves.push(`${j},${i}`)
                else break;
                j++;
                i++;
            }
            for (let i = 1; i < y; i++) {
                if (!Object.values(localOppPieces).includes(`${x},${y - i + 1}`) && !Object.values(localPieces).includes(`${x},${y - i}`))
                    availableMoves.push(`${x},${y - i}`);
                else break;
            }
            for (let i = y + 1; i <= 8; i++) {
                if (!Object.values(localOppPieces).includes(`${x},${i - 1}`) && !Object.values(localPieces).includes(`${x},${i}`))
                    availableMoves.push(`${x},${i}`);
                else break;
            }
            for (let i = 1; i < x; i++) {
                if (!Object.values(localOppPieces).includes(`${x - i + 1},${y}`) && !Object.values(localPieces).includes(`${x - i},${y}`))
                    availableMoves.push(`${x - i},${y}`);
                else break;
            }
            for (let i = x + 1; i <= 8; i++) {
                if (!Object.values(localOppPieces).includes(`${i - 1},${y}`) && !Object.values(localPieces).includes(`${i},${y}`))
                    availableMoves.push(`${i},${y}`);
                else break;
            }
        }
        if (pieceMoveset == "knight") {
            if (!Object.values(localPieces).includes(`${x + 1},${y + 2}`))
                availableMoves.push(`${x + 1},${y + 2}`);
            if (!Object.values(localPieces).includes(`${x - 1},${y + 2}`))
                availableMoves.push(`${x - 1},${y + 2}`);
            if (!Object.values(localPieces).includes(`${x + 1},${y - 2}`))
                availableMoves.push(`${x + 1},${y - 2}`);
            if (!Object.values(localPieces).includes(`${x - 1},${y - 2}`))
                availableMoves.push(`${x - 1},${y - 2}`);
            if (!Object.values(localPieces).includes(`${x + 2},${y + 1}`))
                availableMoves.push(`${x + 2},${y + 1}`);
            if (!Object.values(localPieces).includes(`${x + 2},${y - 1}`))
                availableMoves.push(`${x + 2},${y - 1}`);
            if (!Object.values(localPieces).includes(`${x - 2},${y + 1}`))
                availableMoves.push(`${x - 2},${y + 1}`);
            if (!Object.values(localPieces).includes(`${x - 2},${y - 1}`))
                availableMoves.push(`${x - 2},${y - 1}`);
        }
        if(opp)
            availableMoves = convertToOpponentArr(availableMoves);
        return availableMoves.filter(val => val.split(',')[0] == "9" || val.split(',')[1] == "9" ||  val.split(',')[0] == "0" || val.split(',')[1] == "0" ? false : true);
    }

    const pawnAscension = piece => {
        console.log("test");
        let savedPos = pieces[piece];
        let highestQueenCount = 0;
        Object.keys(pieces).forEach(key => {
            if(key.startsWith("queen")) {
                if(Number(key[key.length - 1]) > highestQueenCount) {
                    highestQueenCount = Number(key[key.length - 1]);
                }
            }
        })
        console.log(piece);
        delete pieces[piece];
        pieces[`queen${highestQueenCount + 1}`] = savedPos;
        console.log(pieces);
        setPieces({...pieces});
    }

    const castling = (piece1, piece2) => {
        let king = piece1.startsWith("king") ? piece1 : piece2;
        let rook = piece1.startsWith("king") ? piece2 : piece1;
        if (pieces[king].split(',')[1] != "8" || pieces[rook].split(',')[1] != "8")
            return false;
        if ((pieces[king].split(',')[0] != "5" && cookies.cookies.currentUser == 2) || (pieces[king].split(',')[0] != "4" && cookies.cookies.currentUser == 1))
            return false;
        if (pieces[king].split(',')[0] > pieces[rook].split(',')[0]) {
            if (!Object.values(pieces).includes("2,8") && !Object.values(pieces).includes("3,8") && (cookies.cookies.currentUser == 2 ? !Object.values(pieces).includes("4,8") : true)) {
                if(cookies.cookies.currentUser != 2) {
                    pieces[king] = "2,8";
                    pieces[rook] = "3,8";
                } else {
                    pieces[king] = "3,8";
                    pieces[rook] = "4,8";
                }
                setPieces({ ...pieces });
                axios.put('http://localhost:9000/api/game/updatePieces', { userId: cookies.cookies.currentUser, pieces: pieces, _id: cookies.cookies.currentId })
                    .then(res => console.log(res))
                socket.emit("move", { pieces: pieces, _id: cookies.cookies.currentId });
                setAvailable([]);
                checkCheck(1);
                setYourTurn(false);
                setSelected({ "pos": "", "name": "", "color": "" });
                return true;
            }
        } else {
            if (!Object.values(pieces).includes("6,8") && !Object.values(pieces).includes("7,8") && (cookies.cookies.currentUser == 1 ? !Object.values(pieces).includes("5,8") : true)) {
                if (cookies.cookies.currentUser != 2) {
                    pieces[king] = "6,8";
                    pieces[rook] = "5,8";
                } else {
                    pieces[king] = "7,8";
                    pieces[rook] = "6,8";
                }
                setPieces({ ...pieces });
                axios.put('http://localhost:9000/api/game/updatePieces', { userId: cookies.cookies.currentUser, pieces: pieces, _id: cookies.cookies.currentId })
                    .then(res => console.log(res))
                socket.emit("move", pieces);
                setAvailable([]);
                checkCheck(1);
                setYourTurn(false);
                setSelected({ "pos": "", "name": "", "color": "" });
                return true;
            }
        }
    }

    return (
        <>
        <div style={{"display": "flex", "flexDirection": "column", "backgroundColor": "white", "width": "800px", "border": "10px inset grey"}}>
        {
            winState == 0 ? board.map((subArr, idx1) => {
                return  (
                    <div style={{"height": "100px", "width": "800px", "display": "flex"}}>
                        {
                            subArr.map((val, idx2) => {
                                let bgColor = idx1 % 2 == 0 ? idx2 % 2 == 0 ? "lightgreen" : "lightblue" : idx2 % 2 == 0 ? "lightblue" : "lightgreen";
                                if (val.name == "king1" && inCheck && ((val.color == "black" && cookies.cookies.currentUser == 2) || (val.color == "white" && cookies.cookies.currentUser == 1))) {
                                    bgColor = "#ffcccb";
                                }
                                let styleObj = { "height": "100px", "width": "100px", "color": val.color, "display": "flex", "alignItems": "center", "justifyContent": "center", "backgroundColor": bgColor};
                                if(val.selected) {
                                    styleObj["height"] = "94px";
                                    styleObj["width"] = "94px";
                                    styleObj["border"] = "3px solid black";
                                }
                                if(val.available) {
                                    styleObj["opacity"] = "0.5";
                                }
                                return <div onClick={() => movePiece(val.name ? val.name : "", `${idx2 + 1},${idx1 + 1}`, val.color)} style={styleObj}>{val.name ? <img style={{ "height": "100px" }} src={images[`${val.color}${val.name.slice(0, val.name.length - 1)}`]} draggable={false}/> : ""}</div>
                            })
                        }
                    </div>
                )
            }) : winState == 1 ? <div style={{ "border": "0px", "backgroundColor": "lightgreen", "display": "flex", "justifyContent": "center" }}><h1>You Won!</h1><br /></div> : <div style={{ "border": "0px", "backgroundColor": "#ffcccb", "display": "flex", "justifyContent": "center" }}><h1>You Lost :(</h1><br/></div>
        }
        </div>
        { winState == 0 ? <h2 style={{"color": "green"}}>{yourTurn ? "Your Turn" : "Opponents Turn"}</h2> : ""}
        <button style={{"padding": "10px 20px", "backgroundColor": "black", "color": "white", "border": "0"}} onClick={() => resetGame()}>Reset</button>
        </>
    )
})
