mmmemory
========

Modestly Multiplayer Online Memory Game

This is a simple implementation of the ages-old memory game. In this
game, pairs of pictures are hidden face down on the game board. 2
pictures are chosen at a time. If they match, then they remain revealed.
Otherwise, they are hidden again. The goal is to reveal all pictures in
the shortest amount of time.

This is primarily a socket.io demonstration. A node.js server stores
the game state and responds to players' moves via events. Multiple
players may join the game and play cooperatively.

To try the game out locally, you will first need to install node.js from:

http://nodejs.org

Next, you will need to install the necessary node.js extensions. From a console, go to the mmmemory clone root folder and enter:

npm node-static
npm socket.io 

Now you can start the server. Again, from the mmmemory folder, enter:

node server.js 1350

This will start a webserver that will listen on port 1350. You can choose a different port number if you like.

To join the game, go to 'http://localhost:1350' from your browser. If you started the server with another port number then replace '1350' with that port number in the URL. The game has been tested with Chrome and Firefox
