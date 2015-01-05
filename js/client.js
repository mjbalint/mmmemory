var socket = io();
var game = null;
var gameId = 0;

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
    socket.emit('list');
    
    socket.on('list', function(gameList){
        logServerMessage(gameList.length + ' games: ' + gameList);
        
        $('#gameButtons').empty();
        $('#gameButtons').append('<p>Select game:<p>');
        for (var i = 0; i < gameList.length; i++) {
            var game = gameList[i];
            logClientMessage('Add button "' + game + '"');
            $('#gameButtons').append(
                '<div class="button" game="' + game + '"><p>' + game + '</p></div>');
        }
        
        $('.button').click(function(){
            gameId = $(this).attr('game');
            logClientMessage('Button ' + gameId);
            
            game = io('/' + gameId);
            game.on('state', function(state) {
                var pieces = state.pieces;
                var matches = state.matches;
                var moves = state.moves;
                var numGroups = state.numGroups;
   
                $('#board').empty();
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
                }

                $('#matchTable').empty();
                for (var i = 0; i < matches.length; i++) {
                    matchTableAdd(matches[i]);
                }
                if (matches.length >= numGroups) {
                    $('#matchTable').append(
                        '<tr><td colspan="2">You won in ' + moves + ' moves!</td></tr>');
                }
                
                $('.piece').click(function(){
                    var pieceIndex = $(this).attr('id');
                    game.emit('selected', { 'gameId':gameId, 'pieceIndex':pieceIndex});
                    logClientMessage('Selected ' + pieceIndex);
                });
            });

            game.on('selected', function(pieceInfo){
                var pieceIndex = pieceInfo.pieceIndex;
                var piece = pieceInfo.piece;
                logServerMessage('Selected ' + pieceIndex);
                $('#' + pieceIndex).css('background-image', 
                                        'url(' + piece.imagePath + ')');
                $('#' + pieceIndex).removeClass('unselected');
                $('#' + pieceIndex).addClass('selected');
            });

            game.on('unselected', function(pieceIndex){
                logServerMessage('Unselected ' + pieceIndex);
                $('#' + pieceIndex).css('background-image', 'none');
                $('#' + pieceIndex).removeClass('selected');
                $('#' + pieceIndex).addClass('unselected');
            });

            game.on('match', function(matchInfo){
                pieceIndices = matchInfo.pieceIndices;
                piece = matchInfo.piece;
                
                logServerMessage(
                    'Matched ' + pieceIndices.length + ' pieces with name ' + piece.name);
                
                for (var i = 0; i < pieceIndices.length; i++) {
                    pieceIndex = pieceIndices[i];
                    $('#' + pieceIndex).removeClass('selected');
                    $('#' + pieceIndex).addClass('unselected');
                }
                matchTableAdd(piece);
            });

            game.on('won', function(moves){
                logServerMessage('You won in ' + moves + ' moves.');
                $('#matchTable').append(
                    '<tr><td colspan="2">You won in ' + moves + ' moves!</td></tr>');
            });
            
            socket.emit('state', gameId);
        });
    });
});