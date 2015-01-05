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
    this.matchedPieces = [];
}

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
    this.matchedPieces = [];
}

console.log("Initialize flags.");
populateFlagIds();

var numGroups = 6;
var groupSize = 2;


// Set up simple webserver to serve our static pages and image files.
var static = require('node-static');
var http = require('http');
var file = new (static.Server)();
var app = http.createServer(function (req, res){
    file.serve(req, res);
}).listen(port);

var numGames = 3;

// Listen to the default namespace.
var io = require('socket.io').listen(app);
io.on('connection', function(socket){
    console.log('/: A user connected.');
    
    socket.on('connect', function(socket){
        console.log('/: A user disconnected.'); 
    });
    
    socket.on('list', function(socket){
        console.log('/: A user asked for a list of games.');
        
        io.emit('list', [1, 2, 3]);
    });
    
        
    socket.on('state', function(gameId){
        console.log('/: Request for state of ' + gameId);
        
        var game = games[gameId];
        var boardPieces = game.pieceList;
        var nameSpace = game.nameSpace;
        var prevPieceIndex = game.prevPieceIndex;
        console.log('prevPieceIndex = ' + prevPieceIndex);
        
        var states = [];
        for (var i = 0; i < boardPieces.pieces.length; i++) {
            var piece = boardPieces.pieces[i];

            if (piece.isMatched) {
                states[i] = {'state':'matched',
                             'imagePath':piece.imagePath};
            } else if (game.prevPieceIndex == i) {
                states[i] = {'state':'selected',
                             'imagePath':piece.imagePath};
            } else {
                states[i] = {'state':'unselected'};
            }
        }
        
        var matches = [];
        for (var i = 0; i < boardPieces.matchedPieces.length; i++) {
            var piece = boardPieces.matchedPieces[i];
            matches[i] = {'name':piece.name, 'imagePath':piece.imagePath};
        } 
        
        nameSpace.emit('state', {'pieces':states,
                                 'matches':matches,
                                 'moves':game.moves,
                                 'numGroups':numGroups});
    });
});

var games = [];

var getNameSpace = function (gameId)
{
    var nameSpace = io.of('/' + gameId);
    nameSpace.on('connection', function(socket){
        console.log('A user connected.');


        socket.on('disconnect', function(socket){
            console.log('/' + socket.gameId + ': A user disconnected');
        });
        
        socket.on('selected', function(pieceInfo){
            var gameId = pieceInfo.gameId;
            var pieceIndex = pieceInfo.pieceIndex;
            var game = games[gameId];
            var boardPieces = game.pieceList;
            var nameSpace = game.nameSpace;
            var piece = boardPieces.pieces[pieceIndex];
            var prevPieceIndex = game.prevPieceIndex;

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
            nameSpace.emit('selected', {'pieceIndex': pieceIndex, 'piece': piece} );

            // A second click on the same unmatched piece clears the selection.
            if (prevPieceIndex === pieceIndex) {
                // A second click clears the selection.
                nameSpace.emit('unselected', pieceIndex);
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
                    boardPieces.numMatched += groupSize;
                    prevPiece.isMatched = true;
                    piece.isMatched = true;
                    boardPieces.matchedPieces.push(piece);
                    nameSpace.emit('match', 
                                   {'pieceIndices':[prevPieceIndex, pieceIndex],
                                    'piece':piece});
                    game.prevPieceIndex = -1;

                    // See if this was the final set needed.

                    if (boardPieces.numMatched >= boardPieces.pieces.length) {
                        nameSpace.emit('won', game.moves);
                    }
                } else {
                    // No match. Hide the previous piece and remember this one.
                    nameSpace.emit('unselected', prevPieceIndex);
                    game.prevPieceIndex = pieceIndex;
                }
            }
        });
    });
    
    return nameSpace;
}

function Game (gameId)
{
    console.log('Create Game ' + gameId);
    this.gameId = gameId;
    this.nameSpace = getNameSpace(this.gameId);
    this.players = 0;
    this.pieceList = new FlagPieceList();
    this.pieceList.initPieces(numGroups, groupSize);
    this.prevPieceIndex = -1;
    this.moves = 0;
}
Game.prototype.reset = function ()
{
    this.pieceList.initPieces(numGroups, groupSize);
    this.prevPieceIndex = -1;
    this.moves = 0;
}

console.log("Create games");
for (var gameId = 1; gameId <= numGames; gameId++) {
    var game = new Game(gameId);
    games[gameId] = game;
}

console.log('listening on *:' + port);