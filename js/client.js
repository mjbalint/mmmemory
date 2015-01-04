socket = io(); 

var addMessage = function (msg)
{
    $('#messages').append('<li>' + msg + '</li>');
}

$(document).ready(function(){
    $('.piece').click(function(){
        var pieceIndex = $(this).attr('id');
        socket.emit('selected', pieceIndex);
        addMessage('<em>local<em>: Selected ' + pieceIndex);
    });
    
    socket.on('selected', function(pieceInfo){
        pieceIndex = pieceInfo.pieceIndex;
        piece = pieceInfo.piece;
        addMessage('<em>remote<em> Selected ' + pieceIndex);
        $('#' + pieceIndex).css('background-image', 
                                'url(' + piece.imagePath + ')');
    });
    
    socket.on('unselected', function(pieceIndex){
        addMessage('<em>remote<em>: Unselected ' + pieceIndex);
        $('#' + pieceIndex).css('background-image', 'none');
    });
    
    socket.on('match', function(piece){
        addMessage('<img class="matchImg" src="' + piece.imagePath + '" /><p>You found the flag of ' + piece.name);
                        /*
                var matchImg = '<img class="matchImg" src="' +
                             piece.imagePath +
                             '" />';
                var matchDescription ="<p>You found " +
                                       piece.getMatchString() +
                                       "!</p>";
                $('#match_table').append(
                    '<tr>' + 
                        '<td>' + matchImg + '</td>' +
                        '<td>' + matchDescription + '</td>' +
                    '</tr>');
                    */
    });
});