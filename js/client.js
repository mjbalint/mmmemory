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

// Initially, we have joined no game and know of no games.
var gameId = null;
var gameIds = [];

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

// Update game join/reset buttons
var updateButtons = function ()
{
    $('#gameButtons').empty();
    for (var i = 0; i < gameIds.length; i++) {
        var game = gameIds[i];
        
        var buttonClass = 'join';
        var buttonAction = 'Join';
        if (game === gameId) {
            // Create a 'Reset' button for the current game instead of a join one.

            buttonClass = 'reset';
            buttonAction = 'Reset';
        }
        logClientMessage('Add ' + buttonClass +' button for "' + game + '"');
        
        $('#gameButtons').append(
            '<div class="button ' + buttonClass + '" game="' + game + '">' +
              '<p>' + buttonAction + ' <strong>' + game + '</strong></p>' +
            '</div>');
    }
     
    // 'Join <game>' button handler
    $('.join').click(function(){
        gameId = $(this).attr('game');

        logClientMessage('Join game ' + gameId);
        updateButtons();
        socket.emit('join', gameId);
    });

    // 'Reset <game>' button handler
    $('.reset').click(function(){
        var gameId = $(this).attr('game');
        
        logClientMessage('Reset game ' + gameId);
        socket.emit('reset', gameId);
    });
}

// Add an entry to the end of the match table.
var matchTableAdd = function (piece, player)
{
    var matchImg = '<img class="matchImg" src="' + piece.imagePath + '" />';
    var matchUrl = 'https://en.wikipedia.org/wiki/' + piece.name;
    var matchDescription =
        '<p>' +
            '<strong>' + player + '</strong> found the flag of ' +
                '<a target="_blank" href="' + matchUrl + '">' +
                    piece.name +
                '</a>.' +
            '</p>';
    
    $('#matchTable').append('<tr>' + 
                                '<td>' + matchImg + '</td>' +
                                '<td>' + matchDescription + '</td>' +
                            '</tr>');
}

// Fade in pieces on the board.
var pieceIds = [];
var fadeInPieces = function (numPieces)
{
    // Call fadeIn on each piece in sequence.
    // We stagger the calls to get a sequential effect.
    // The interval (in milliseconds) is chosen so that all
    // pieces are ready within 1 second.
    var interval = (1000 / numPieces);
    for (var i = 0; i < numPieces; i++) {
        pieceIds.push(numPieces - i - 1);
        setTimeout(
            function(){
                var pieceId = pieceIds.pop();
                $('#' + pieceId).fadeIn();
            },
            interval * (i+1));  
    }
}

$(document).ready(function(){
    $('.connect').click(function(){
        // Report player name and ask the server for a list of available games.
        var player = $('#player').val();
        player.replace(/[^a-zA-Z0-9 ]/g, ""); 
        if ('' !== player) {
            socket.emit('name', player);
        }
        socket.emit('list');
    });

    
    // Respond to the server sending us a list of available games.
    // We only expect to get such a message in response to our own 'list' event.
    socket.on('list', function(gameList){
        logServerMessage(gameList.length + ' games: ' + gameList);
        
        // Set up a 'Join' and 'Reset' button for each available game.
        gameIds = gameList;
        updateButtons();

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
                if (piece.state === 'unselected') {
                    logClientMessage('Hide piece ' + i);
                    $('#' + i).append('<span class="question">?</span>');
                } else {
                    logClientMessage('Show piece ' + i);
                    $('#' + i).css('background-image',
                                   'url(' + piece.imagePath + ')');
                }
                $('#' + i).addClass(piece.state);
                $('#' + i).addClass(pieceSizeClass);
                $('#' + i).hide();
            }
            fadeInPieces(pieces.length);

            // Clear the match information and repopulate from the state.
            $('#matchTable').empty();
            for (var i = 0; i < matches.length; i++) {
                matchTableAdd(matches[i], matches[i].player);
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
            
            $('.piece').hover(
                function(){
                    if ($(this).hasClass('unselected')) {
                        $(this).addClass('preselected');
                    }
                },
                function(){
                    $(this).removeClass('preselected');
                }
            );
        });

        // A player selected a piece.
        socket.on('selected', function(pieceInfo){
            var pieceIndex = pieceInfo.pieceIndex;
            var piece = pieceInfo.piece;
            logServerMessage('Selected ' + pieceIndex);
            $('#' + pieceIndex).empty();
            $('#' + pieceIndex).css('background-image', 
                                    'url(' + piece.imagePath + ')');
            $('#' + pieceIndex).removeClass('unselected');
            $('#' + pieceIndex).removeClass('preselected');
            $('#' + pieceIndex).addClass('selected');
        });

        // A piece needs to be returned to initial state
        // due to a 'selected' event that did not result
        // in a match
        socket.on('unselected', function(pieceIndex){
            logServerMessage('Unselected ' + pieceIndex);
            $('#' + pieceIndex).css('background-image', 'none');
            $('#' + pieceIndex).append('<span class="question">?</span>');
            $('#' + pieceIndex).removeClass('preselected');
            $('#' + pieceIndex).removeClass('selected');
            $('#' + pieceIndex).addClass('unselected');
        });

        // A player found a matching group of pieces.
        socket.on('match', function(matchInfo){
            pieceIndices = matchInfo.pieceIndices;
            piece = matchInfo.piece;
            player = matchInfo.player;

            logServerMessage(
                'Matched ' + pieceIndices.length + ' pieces with name ' + piece.name);

            // The pieces should already have their images revealed, so we just
            // need to clear the selection circles.
            for (var i = 0; i < pieceIndices.length; i++) {
                pieceIndex = pieceIndices[i];
                $('#' + pieceIndex).removeClass('selected');
                $('#' + pieceIndex).removeClass('unselected');
                $('#' + pieceIndex).removeClass('preselected');
                $('#' + pieceIndex).addClass('matched');
            }
            
            // Record the details of the match.
            matchTableAdd(piece, player);
        });

        // Game completed!
        socket.on('won', function(moves){
            logServerMessage('You won in ' + moves + ' moves.');
            $('#matchTable').append(
                '<tr><td colspan="2">You won in ' + moves + ' moves!</td></tr>');
        });
    });
});