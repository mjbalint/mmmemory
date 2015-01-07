/*
 * Modestly Multiplayer Memory Game -- Server Javascript
 *
 * The Javascript portion of the client is responsible for managing the game state
 * (the client will provide a view of that state). It communicates with the client using
 * the socket.io module.
 *
 * The server currently supports only one picture set, one containing flags of the world.
 * Mainly to gain experience with the object-oriented portions of Javascript, I have
 * modelled the lists of pieces with an abstract class Piece which is specialized as
 * a FlagPiece. Container classes PieceList and FlagPieceList share a similar relationship.
 * In this way, we could easily add more picture sets.
 *
 * The flag images are stored on the server as as .png files whose names correspond to
 * the country's two-letter (ISO 3166-1 alpha-2) country codes.
 *
 * The games themselves are represented by the Game class, which holds the pieces along
 * with additional state information, such as the number of moves that have been taken
 * by the players. Each game object needs to store enough information that the current
 * game state can be recreated by any client.
 *
 * The server initially creates a static set of games, graded from easy to hard based
 * on the number of groups of pieces.
 *
 * After a client first connects, it will request a list of available games with a 'list'
 * event. The server responds to the this event by sending a message to the client's 
 * unique room. socket.io automatically adds each client to its own room named after
 * its unique socket identifer. We use a similar technique to send am event to a single
 * client in response to a client's 'join' request.
 *
 * Clients are only allowed to be part of one game at a time. When a client joins a game,
 * it is added to the room for that game. When game state is modified, we send an update
 * to that game's room. Most events that we send to clients ('selected', 'unselected',
 * 'match' and 'won') are triggered in response to a client sending us a 'selected' event.
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

// If the user supplied a port number then listen on that, otherwise use
// the default of 80. 80 is currently the only usable listening port when
// running on nodejitsu.com.
var port = 80;
if (process.argv.length > 2) {
    port = parseInt(process.argv[2], 10);
}

function Piece (name, imagePath)
{
    this.name = name;
    this.imagePath = imagePath;
    this.isMatched = false;
}
Piece.prototype.getMatchString = function () {
    return (this.name);
};

function PieceList (name, description)
{
    this.name = name;
    this.description = description;
    this.pieces = [];
    this.numMatched = 0;
    this.matches = [];
}

// A mapping of country codes to the full name.
var flagIdToName = {  
    'ad': 'Andorra',
    'ae': 'United Arab Emirates',
    'af': 'Afghanistan',
    'ag': 'Antigua and Barbuda',
    'ai': 'Anguilla',
    'al': 'Albania',
    'am': 'Armenia',
    'an': 'Netherlands Antilles',
    'ao': 'Angola',
    'ar': 'Argentina',
    'as': 'American Samoa',
    'at': 'Austria',
    'au': 'Australia',
    'aw': 'Aruba',
    'ax': 'Aland Islands',
    'ba': 'Bonia and Herzegovina',
    'bb': 'Barbados',
    'bd': 'Bangladesh',
    'be': 'Belgium',
    'bf': 'Burkina Faso',
    'bg': 'Bulgaria',
    'bh': 'Bahrain',
    'bi': 'Burundi',
    'bj': 'Benin',
    'bm': 'Bermuda',
    'bn': 'Brunei',
    'bo': 'Bolivia',
    'br': 'Brazil',
    'bs': 'Bahamas',
    'bt': 'Bhutan',
    'bw': 'Botswana',
    'by': 'Belarus',
    'bz': 'Belize',
    'ca': 'Canada',
    'cd': 'Democratic Republic of the Congo',
    'cf': 'Central African Republic',
    'cg': 'Congo',
    'ch': 'Switzerland',
    'ci': "Cote d'Ivoire",
    'ck': 'Cook Islands',
    'cl': 'Chile',
    'cm': 'Cameroon',
    'cn': 'China',
    'co': 'Colombia',
    'cr': 'Costa Rica',
    'cu': 'Cuba',
    'cv': 'Cabo Verde',
    'cx': 'Christmas Island',
    'cy': 'Cyprus',
    'cz': 'Czech Republic',
    'de': 'Germany',
    'dj': 'Djibouti',
    'dk': 'Denmark',
    'dm': 'Dominica',
    'do': 'Dominican Republic',
    'dz': 'Algeria',
    'ec': 'Ecuador',
    'ee': 'Estonia',
    'eg': 'Egypt',
    'er': 'Eritrea',
    'es': 'Spain',
    'et': 'Ethiopia',
    'eu': 'European Union',
    'fi': 'Finland',
    'fj': 'Fiji',
    'fk': 'Falkland Islands',
    'fm': 'Federated States of Micronesia',
    'fo': 'Faroe Islands',
    'fr': 'France',
    'ga': 'Gabon',
    'gd': 'Grenada',
    'ge': 'Georgia',
    'gg': 'Guernsey',
    'gh': 'Ghana',
    'gi': 'Gibraltar',
    'gl': 'Greenland',
    'gm': 'Gambia',
    'gn': 'Guinea',
    'gq': 'Equatorial Guinea',
    'gr': 'Greece',
    'gr-cy': 'Greek Cyprus',
    'gs': 'South Georgia and the South Sandwich Islands',
    'gt': 'Guatemala',
    'gu': 'Guam',
    'gw': 'Guinea-Bissau',
    'gy': 'Guyana',
    'hk': 'Hong Kong',
    'hn': 'Heard Island and McDonald Islands',
    'hr': 'Croatia',
    'ht': 'Haiti',
    'hu': 'Hungary',
    'id': 'Indonesia',
    'ie': 'Ireland',
    'il': 'Israel',
    'im': 'Isle of Man',
    'in': 'India',
    'io': 'British Indian Ocean Territory',
    'iq': 'Iraq',
    'ir': 'Iran',
    'is': 'Iceland',
    'it': 'Italy',
    'je': 'Jersey',
    'jm': 'Jamaica',
    'jo': 'Jordan',
    'jp': 'Japan',
    'ke': 'Kenya',
    'kg': 'Kyrgyzstan',
    'kh': 'Cambodia',
    'ki': 'Kiribati',
    'km': 'Comoros',
    'kn': 'Saint Kitts and Nevis',
    'kp': 'North Korea',
    'kr': 'South Korea',
    'kw': 'Kuwait',
    'ky': 'Cayman Islands',
    'kz': 'Kazakhstan',
    'la': 'Laos',
    'lb': 'Lebanon',
    'lc': 'Saint Lucia',
    'li': 'Liechtenstein',
    'lk': 'Sri Lanka',
    'lr': 'Liberia',
    'ls': 'Lesotho',
    'lt': 'Lithuania',
    'lu': 'Luxembourg',
    'lv': 'Latvia',
    'ly': 'Libya',
    'ma': 'Morocco',
    'mc': 'Monaco',
    'md': 'Moldova',
    'me': 'Montenegro',
    'mg': 'Madagascar',
    'mh': 'Marshall Islands',
    'ml': 'Mali',
    'mn': 'Mongolia',
    'mo': 'Macao',
    'mp': 'Northern Mariana Islands',
    'mq': 'Martinique',
    'mr': 'Mauritania',
    'ms': 'Montserrat',
    'mt': 'Malta',
    'mu': 'Mauritius',
    'mv': 'Maldives',
    'mw': 'Malawi',
    'mx': 'Mexico',
    'my': 'Malaysia',
    'mz': 'Mozambique',
    'na': 'Namibia',
    'ne': 'Niger',
    'nf': 'Norfolk Island',
    'ng': 'Nigeria',
    'ni': 'Nicaragua',
    'nl': 'Netherlands',
    'no': 'Norway',
    'np': 'Nepal',
    'nr': 'Nauru',
    'nu': 'Niue',
    'nz': 'New Zealand',
    'om': 'Oman',
    'pa': 'Panama',
    'pf': 'French Polynesia',
    'pg': 'Papua New Guinea',
    'ph': 'Philippines',
    'pk': 'Pakistan',
    'pl': 'Poland',
    'pm': 'Saint Pierre and Miquelon',
    'pn': 'Pitcairn',
    'pr': 'Puerto Rico',
    'pt': 'Portugal',
    'pw': 'Palau',
    'py': 'Paraguay',
    'qa': 'Qatar',
    'ro': 'Romania',
    'rs': 'Serbia',
    'ru': 'Russia',
    'rw': 'Rwanda',
    'sa': 'Saudi Arabia',
    'sb': 'Solomon Islands',
    'sc': 'Seychelles',
    'sd': 'Sudan',
    'se': 'Sweden',
    'sg': 'Singapore',
    'sh': 'Saint Helena, Ascension and Tristan da Cunha',
    'si': 'Slovenia',
    'sk': 'Slovakia',
    'sl': 'Sierra Leone',
    'sm': 'San Marino',
    'sn': 'Senegal',
    'so': 'Somalia',
    'sr': 'Suriname',
    'st': 'Sao Tome and Principe',
    'sv': 'El Salvador',
    'sy': 'Syria',
    'sz': 'Swaziland',
    'tc': 'Turks and Caicos Islands',
    'td': 'Chad',
    'tg': 'Togo',
    'th': 'Thailand',
    'tj': 'Tajikistan',
    'tl': 'Timor-Leste',
    'tm': 'Turkmenistan',
    'tn': 'Tunisia',
    'to': 'Tonga',
    'tr': 'Turkey',
    'tt': 'Trinidad and Tobago',
    'tv': 'Tuvalu',
    'tw': 'Taiwan',
    'tz': 'Tanzania',
    'ua': 'Ukraine',
    'ug': 'Uganda',
    'uk': 'United Kingdom',
    'us': 'United States of America',
    'uy': 'Uruguay',
    'uz': 'Uzbekistan',
    'vc': 'Saint Vincent and the Grenadines',
    've': 'Venezuela',
    'vg': 'British Virgin Islands',
    'vi': 'U.S. Virgin Islands',
    'vn': 'Vietnam',
    'vu': 'Vanuatu',
    'wf': 'Wallis and Futuna',
    'ws': 'Samoa',
    'ye': 'Yemen',
    'yt': 'Mayotte',
    'za': 'South Africa',
    'zm': 'Zambia',
    'zw': 'Zimbabwe',
};

var flagIds = [];
var populateFlagIds = function ()
{
    for (var flagId in flagIdToName) {
       flagIds.push(flagId);
    }
}

var getRandomFlag = function ()
{
    var pos = Math.floor(Math.random() * flagIds.length);
    var flagId = flagIds[pos]; 

    return (flagId);
};

function FlagPiece (flagId)
{
    this.name = flagIdToName[flagId];
    this.imagePath = 'img/flag/' + flagId + '.png'; 
}
FlagPiece.prototype = new Piece();
FlagPiece.prototype.getMatchString = function () {
    return ('the flag of ' + this.name);
};

function FlagPieceList ()
{
    this.name = 'flags';
    this.description = 'Flags of the world';
}
FlagPieceList.prototype = new PieceList();
FlagPieceList.prototype.initPieces = function (numGroups, groupSize)
{
    /*
     * Choose the flag to use for each group and then assign a random
     * order to each member of the group.
     *
     * We allow duplicates, which simplifies our bounds checking since
     * we don't need to worry about the number of groups being greater 
     * than the number of image choices.
     */
    var orderToFlagId = {};
    for (var i = 0; i < numGroups; i++) {
        var flagId = getRandomFlag();

        for (var j = 0; j < groupSize; j++) {
            do {
                var order = Math.random()

                /*
                 * It is unlikely that we will get identical random
                 * numbers with this small sample size, but we will check just in case.
                 */
                if (! orderToFlagId.hasOwnProperty(order)) {
                    orderToFlagId[order] = flagId;
                    break;
                }
            } while (true);
        }
    }

    /*
     * Sort the order keys
     */
    var orderList = [];
    for (var order in orderToFlagId) {
        orderList.push(order);
    }
    orderList.sort();

    /*
     * Now we can go ahead and create the pieces. 
     */
    this.pieces = [];
    for (var i = 0; i < orderList.length; i++) {
        var order = orderList[i];
        var flagId = orderToFlagId[order];
        this.pieces.push(new FlagPiece(flagId));
    }
    this.matches = [];
    this.numMatched = 0;
}

console.log("Initialize flags.");
populateFlagIds();

// Set up a simple webserver to serve our static pages and image files.
// Once it is created, we can use it to listen for client events.
var static = require('node-static');
var http = require('http');
var file = new (static.Server)();
var app = http.createServer(function (req, res){
    file.serve(req, res);
}).listen(port);

var numGames = 3;
var games = {};

var socketIdToGameId = {};

// Build the state message for the current state of a game
var getGameState = function (gameId)
{
    var game = games[gameId];
    var boardPieces = game.pieceList;
    var prevPieceIndex = game.prevPieceIndex;

    var states = [];
    for (var i = 0; i < boardPieces.pieces.length; i++) {
        var piece = boardPieces.pieces[i];

        if (piece.isMatched) {
            states[i] = {state: 'matched',
                         imagePath: piece.imagePath};
        } else if (game.prevPieceIndex == i) {
            states[i] = {state: 'selected',
                         imagePath: piece.imagePath};
        } else {
            states[i] = {state: 'unselected'};
        }
    }

    var matches = [];
    for (var i = 0; i < boardPieces.matches.length; i++) {
        var matchInfo = boardPieces.matches[i];
        var piece = matchInfo.piece;
        var player = matchInfo.player;
        matches[i] = {name: piece.name,
                      imagePath: piece.imagePath,
                      player: player};
    }
    
    return ({pieces: states,
             matches: matches,
             moves: game.moves,
             numGroups: game.numGroups});
}

var socketIdToName = {};
var numPlayers = 0;

// Listen to the default namespace.
var io = require('socket.io').listen(app);
io.on('connection', function(socket){
    console.log('/: ' + socket.id + ' connected.');
    numPlayers++;
    socketIdToName[socket.id] = 'Player' + numPlayers;
    
    
    // When a client disconnects, will automatically leave all groups,
    // but we still need to tidy up our mapping table.
    socket.on('disconnect', function(){
        console.log('/: ' + socket.id + ' disconnected.');
        
        if (socketIdToGameId.hasOwnProperty(socket.id)) {
            console.log('/: ' + socket.id + ' leaves ' + socketIdToGameId[socket.id]);
            socket.leave(socketIdToGameId[socket.id]);
            delete (socketIdToGameId[socket.id]);
        }
    });
    
    // A client has identified themselves.
    socket.on('name', function(name){
        console.log('/: ' + socket.id + ' is called "' + name + '"');
        
        socketIdToName[socket.id] = name;
    });
    
    // A client has requested a list of all available games.
    socket.on('list', function(){
        console.log('/: ' + socket.id + ' asked for a list of games.');
        
        // Send a response only to the originator by using the client's unique group
        io.to(socket.id).emit('list', ['Easy', 'Normal', 'Hard']);
    });
    
    // A client wishes to join a game.
    socket.on('join', function(gameId){
        console.log('/: ' + socket.id + ' requested to join ' + gameId);
        
        // Remove the client from the previous game, if any.
        if (socketIdToGameId.hasOwnProperty(socket.id)) {
            console.log('/: ' + socket.id + ' leaves ' + socketIdToGameId[socket.id]);
            socket.leave(socketIdToGameId[socket.id]);
        }
        
        // Join the new game.
        socket.join(gameId);
        socketIdToGameId[socket.id] = gameId;
        
        // Send the current games state a response only to the originator by using the
        // client's unique group
        var state = getGameState(gameId);
        io.to(socket.id).emit('state', state);
    });
    
    // Re-initialize a game.
    socket.on('reset', function(gameId){
        console.log('/: ' + socket.id + ' requested to reset ' + gameId);
        
        var game = games[gameId];
        game.reset();
        
        var state = getGameState(gameId);
        
        // Send full state to everyone who is playing this game.
        io.to(gameId).emit('state', state);
    });
    
    // A player has selected a piece.
    socket.on('selected', function(pieceInfo){
        console.log('/' + socket.id + ': Selected');
        
        var gameId = pieceInfo.gameId;
        var pieceIndex = pieceInfo.pieceIndex;
        var game = games[gameId];
        var boardPieces = game.pieceList;
        var piece = boardPieces.pieces[pieceIndex];
        var prevPieceIndex = game.prevPieceIndex;
        var player = socketIdToName[socket.id];

        // Ignore clicks on already matched pieces.
        if (piece.isMatched) {
            console.log('/' + gameId + ': ' +
                        'selected already matched ' + pieceIndex);
            return;
        }

        // Record this selection event and notify the clients.
        game.moves++;
        console.log('/' + gameId + ': ' +
                    'selected ' + pieceIndex + '; ' + game.moves + ' moves so far.');
        io.to(gameId).emit(
            'selected', {'pieceIndex': pieceIndex, 'piece': piece} );

        // A second click on the same unmatched piece clears the selection.
        if (prevPieceIndex === pieceIndex) {
            // A second click clears the selection.
            io.to(gameId).emit('unselected', pieceIndex);
            game.prevPieceIndex = -1;
            return;
        }

        // Compare this piece to the previous one to see how to proceed.
        if (prevPieceIndex < 0) {
            // Nothing already selected
            game.prevPieceIndex = pieceIndex;
        } else {
            prevPiece = boardPieces.pieces[prevPieceIndex];

            if (prevPiece.name === piece.name) {
                // Match!

                // Record the match and report it to clients.
                boardPieces.numMatched += game.groupSize;
                prevPiece.isMatched = true;
                piece.isMatched = true;
                boardPieces.matches.push({piece: piece, player: player});
                io.to(gameId).emit(
                    'match', {pieceIndices: [prevPieceIndex, pieceIndex],
                              piece: piece,
                              player: player});
                game.prevPieceIndex = -1;

                // See if this was the final set needed.

                if (boardPieces.numMatched >= boardPieces.pieces.length) {
                    io.to(gameId).emit('won', game.moves);
                }
            } else {
                // No match. Hide the previous piece and remember this one.
                io.to(gameId).emit('unselected', prevPieceIndex);
                game.prevPieceIndex = pieceIndex;
            }
        }
    });
});
      
function Game (gameId, numGroups)
{
    console.log('Create Game ' + gameId);
    this.gameId = gameId;
    this.players = 0;
    this.pieceList = new FlagPieceList();
    this.prevPieceIndex = -1;
    this.moves = 0;
    this.numGroups = numGroups;
    this.groupSize = 2;
    this.pieceList.initPieces(this.numGroups, this.groupSize);
}
Game.prototype.reset = function ()
{
    this.pieceList.initPieces(this.numGroups, this.groupSize);
    this.prevPieceIndex = -1;
    this.moves = 0;
}

console.log("Create games");
games['Easy'] = new Game('Easy', 4);
games['Normal'] = new Game('Normal', 8);
games['Hard'] = new Game('Hard', 16);

console.log('listening on *:' + port);