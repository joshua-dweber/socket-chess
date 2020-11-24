const ChessController = require('../controllers/chess.controller');
module.exports = function (app) {
    app.get('/api/game/getGames', ChessController.games);
    app.post('/api/game/create', ChessController.createGame);
    app.post('/api/users/join', ChessController.join);
    app.post('/api/game/getPieces', ChessController.getPieces);
    app.put('/api/game/updatePieces', ChessController.updatePieces);
    app.put('/api/game/attackPieces', ChessController.attackPieces);
    app.post('/api/game/deleteGame', ChessController.deleteGame);
}
