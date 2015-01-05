/*
 * Modestly Multiplayer Memory Game -- Client Javascript
 *
 * The Javascript portion of the client is responsible for managing the game board.
 * It communicates with the server using the socket.io module which will be loaded
 * before this script by the client's index.html file.
 *
 * When the script starts, it will first get the list of games from the server.
 * It uses this information to sets up control buttons to join and reset the games.
 *
 * To join a game, the client sends a 'join' event and waits for a 'state' event
 * to arrive. It then sets up the board to match the state.
 *
 * Once a game is joined, the client will send 'selected' events whenever the user
 * clicks on a game piece. The board only updates after a server event event.
 * The client responds to 'selected' events by revealing a game piece's image and
 * adding a selection circle to the piece. It responds to 'unselected' events by
 * restoring the piece to a blank circle. A 'match' event will clear the selection
 * circles but leave the image revealed. It will also add an entry to the match list.
 * Finally, when all pieces are revealed the server will send a 'won' event.
 * 
 * Note that the client expects the server to only send it events for the game that
 * it has joined.
 *
 * @author Matthew Balint
 * @date December 2014
 */

// The socket.io module is loaded before this one by a <script> directive in index.html.
var socket = io();

// Our current game. Initially, we have joined no game. 
var gameId = null;

// Set to true to add raw event logging to the bottom of each client's pages.
var enableLog = false;
var logMessage = function (msg)
{
    if (enableLog) {
        $('#log').append('<li class="logEntry">' + msg + '</li>');
    }
}
var logClientMessage = function(msg)
{
    logMessage('<em>local</em>: ' + msg);
}

var logServerMessage = function(msg)
{
    logMessage('<em>remote</em>: ' + msg);
}

// Add an entry to the end of the match table.
var matchTableAdd = function (piece)
{
    var matchImg = '<img class="matchImg" src="' + piece.imagePath + '" />';
    var matchUrl = 'https://en.wikipedia.org/wiki/' + piece.name;
    var matchDescription =
        '<p>' +
            'You found the flag of ' +
                '<a target="_blank" href="' + matchUrl + '">' +
                    piece.name +
                '</a>.' +
            '</p>';
    
    $('#matchTable').append('<tr>' + 
                                '<td>' + matchImg + '</td>' +
                                '<td>' + matchDescription + '</td>' +
                            '</tr>');
}


$(document).ready(function(){
    // Ask the server for a list of available games.
    socket.emit('list');
    
    // Respond to the server sending us a list of available games.
    // We only expect to get such a message in response to our own 'list' event.
    socket.on('list', function(gameList){
        logServerMessage(gameList.length + ' games: ' + gameList);
        
        // Set up a 'Join' and 'Reset' button for each available game.
        $('#gameButtons').empty();
        for (var i = 0; i < gameList.length; i++) {
            var game = gameList[i];
            logClientMessage('Add button "' + game + '"');
            $('#gameButtons').append(
                '<div class="button join" game="' + game + '"><p>Join ' + game + '</p></div>' +
                '<div class="button reset" game="' + game + '"><p>Reset ' + game + '</p></div>');
        }
        
        // 'Join <game>' button handler
        $('.join').click(function(){
            gameId = $(this).attr('game');
            
            logClientMessage('Join game ' + gameId);
            socket.emit('join', gameId);
        });
        
        // 'Reset <game>' button handler
        $('.reset').click(function(){
            var gameId = $(this).attr('game');
            
            logClientMessage('Reset game ' + gameId);
            socket.emit('reset', gameId);
        });

        // Receive complete game state.
        // This event may be triggered by either our own 'join'
        // event or by a 'reset' event (ours or another player's).
        socket.on('state', function(state) {
            var pieces = state.pieces;
            var matches = state.matches;
            var moves = state.moves;
            var numGroups = state.numGroups;
            var pieceSizeClass = 'largePiece';
            
            // Clear the board of any existing pieces then
            // repopulate from the state information.
            $('#board').empty();

            // Try to scale the pieces to fit better
            if (pieces.length < 10) {
                pieceSizeClass = 'pieceLarge';
            } else if (pieces.length < 20) {
                pieceSizeClass = 'pieceMedium';
            } else {
                pieceSizeClass = 'pieceSmall';
            }

            for (var i = 0; i < pieces.length; i++) {
                var piece = pieces[i];

                logClientMessage('Create piece ' + i);
                $('#board').append('<div class="piece" id="' + i + '">');
                if (piece.state !== 'unselected') {
                    logClientMessage('Show piece ' + i);
                    $('#' + i).css('background-image',
                                   'url(' + piece.imagePath + ')');
                }
                if (piece.state === 'selected') {
                    $('#' + i).addClass('selected');
                } else {
                    $('#' + i).addClass('unselected');
                }
                $('#' + i).addClass(pieceSizeClass);
            }

            // Clear the match information and repopulate from the state.
            $('#matchTable').empty();
            for (var i = 0; i < matches.length; i++) {
                matchTableAdd(matches[i]);
            }
            if (matches.length >= numGroups) {
                $('#matchTable').append(
                    '<tr><td colspan="2">You won in ' + moves + ' moves!</td></tr>');
            }

            // Redefine the 'on-click' handler for the newly created pieces.
            $('.piece').click(function(){
                var pieceIndex = $(this).attr('id');
                socket.emit('selected', {gameId: gameId, pieceIndex: pieceIndex});
                logClientMessage('Selected ' + pieceIndex);
            });
        });

        // A player selected a piece.
        socket.on('selected', function(pieceInfo){
            var pieceIndex = pieceInfo.pieceIndex;
            var piece = pieceInfo.piece;
            logServerMessage('Selected ' + pieceIndex);
            $('#' + pieceIndex).css('background-image', 
                                    'url(' + piece.imagePath + ')');
            $('#' + pieceIndex).removeClass('unselected');
            $('#' + pieceIndex).addClass('selected');
        });

        // A piece needs to be returned to initial state
        // due to a 'selected' event that did not result
        // in a match
        socket.on('unselected', function(pieceIndex){
            logServerMessage('Unselected ' + pieceIndex);
            $('#' + pieceIndex).css('background-image', 'none');
            $('#' + pieceIndex).removeClass('selected');
            $('#' + pieceIndex).addClass('unselected');
        });

        // A player found a matching group of pieces.
        socket.on('match', function(matchInfo){
            pieceIndices = matchInfo.pieceIndices;
            piece = matchInfo.piece;

            logServerMessage(
                'Matched ' + pieceIndices.length + ' pieces with name ' + piece.name);

            // The pieces should already have their images revealed, so we just
            // need to clear the selection circles.
            for (var i = 0; i < pieceIndices.length; i++) {
                pieceIndex = pieceIndices[i];
                $('#' + pieceIndex).removeClass('selected');
                $('#' + pieceIndex).addClass('unselected');
            }
            
            // Record the details of the match.
            matchTableAdd(piece);
        });

        // Game completed!
        socket.on('won', function(moves){
            logServerMessage('You won in ' + moves + ' moves.');
            $('#matchTable').append(
                '<tr><td colspan="2">You won in ' + moves + ' moves!</td></tr>');
        });
    });
});