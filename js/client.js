socket = io(); 

// Set to true to add raw event logging to the bottom of each client's pages.
var enableLog = false;
var logMessage = function (msg)
{
    if (enableLog) {
        $('#log').append('<li class="logEntry">' + msg + '</li>');
    }
}

$(document).ready(function(){
    $('.piece').click(function(){
        var pieceIndex = $(this).attr('id');
        socket.emit('selected', pieceIndex);
        logMessage('<em>local<em>: Selected ' + pieceIndex);
    });
    
    socket.on('selected', function(pieceInfo){
        var pieceIndex = pieceInfo.pieceIndex;
        var piece = pieceInfo.piece;
        logMessage('<em>remote<em> Selected ' + pieceIndex);
        $('#' + pieceIndex).css('background-image', 
                                'url(' + piece.imagePath + ')');
    });
    
    socket.on('unselected', function(pieceIndex){
        logMessage('<em>remote<em>: Unselected ' + pieceIndex);
        $('#' + pieceIndex).css('background-image', 'none');
    });
    
    socket.on('match', function(piece){
        logMessage('<em>remote<em>: Matched ' + piece.name);
    
        var matchImg = '<img class="matchImg" src="' + piece.imagePath + '" />';
        var matchUrl = 'https://en.wikipedia.org/wiki/' + piece.name;
        var matchDescription =
            '<p>' +
                'You found the flag of ' +
                    '<a href="' + matchUrl + '">' + piece.name + '</a>.' +
            '</p>';
        $('#matchTable').append('<tr>' + 
                                  '<td>' + matchImg + '</td>' +
                                  '<td>' + matchDescription + '</td>' +
                                '</tr>');
    });
    
    socket.on('won', function(moves){
        logMessage('You won in ' + moves + ' moves.');
        $('#matchTable').append('<tr><td colspan="2">You won in ' + moves + ' moves!</td></tr>');
    });
});