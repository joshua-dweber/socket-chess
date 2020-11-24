const CurrentGame = require('../models/chess.model');
module.exports = {
    games: (req, res) => {
        CurrentGame.find({})
            .then(games => res.json(games))
    },
    createGame: (req, res) => {
        CurrentGame.create({
            name: req.body.name,
            pieces1: {
                "rook1": "1,8",
                "rook2": "8,8",
                "knight1": "2,8",
                "knight2": "7,8",
                "bishop1": "3,8",
                "bishop2": "6,8",
                "queen1": "5,8",
                "king1": "4,8",
                "pawn1": "1,7",
                "pawn2": "2,7",
                "pawn3": "3,7",
                "pawn4": "4,7",
                "pawn5": "5,7",
                "pawn6": "6,7",
                "pawn7": "7,7",
                "pawn8": "8,7"},
            pieces2: {
                "rook1": "1,8",
                "rook2": "8,8",
                "knight1": "2,8",
                "knight2": "7,8",
                "bishop1": "3,8",
                "bishop2": "6,8",
                "queen1": "4,8",
                "king1": "5,8",
                "pawn1": "1,7",
                "pawn2": "2,7",
                "pawn3": "3,7",
                "pawn4": "4,7",
                "pawn5": "5,7",
                "pawn6": "6,7",
                "pawn7": "7,7",
                "pawn8": "8,7"}})
            .then(game => res.json(game))
            .catch(err => res.status(400).json(err));
    },
    join: (req, res) => {
        CurrentGame.findOneAndUpdate({_id: req.body._id}, {[`user${req.body.num}`]: true}, { new: true })
            .then(game => res.json(game))
            .catch(err => res.status(400).json(err));
    },
    getPieces: (req, res) => {
        CurrentGame.findOne({_id: req.body._id})
            .then(game => res.json(game))
            .catch(err => res.status(400).json(err))
    },
    updatePieces: (req, res) => {
        CurrentGame.findOneAndUpdate({ _id: req.body._id }, {[`pieces${req.body.userId}`]: req.body.pieces, currentTurn: req.body.userId == 1 ? 2 : 1}, { new: true})
            .then(game => res.json(game))
            .catch(err => res.status(400).json(err));
    },
    attackPieces: (req, res) => {
        CurrentGame.findOneAndUpdate({ _id: req.body._id }, { [`pieces${req.body.userId}`]: req.body.pieces, [`pieces${req.body.oppId}`]: req.body.oppPieces, currentTurn: req.body.userId == 1 ? 2 : 1 }, { new: true })
            .then(game => res.json(game))
            .catch(err => res.status(400).json(err));
    },
    deleteGame: (req, res) => {
        console.log(req.body)
        CurrentGame.deleteOne({ _id: req.body._id})
            .then(conf => res.json(conf))
            .catch(err => res.status(400).json(err));
        
    },
}