terries
=======

A two player, pseudo-real-time strategy game in a web browser. Players take turns moving a small set of units to attempt capture and hold territory before time runs out.

Terries is inspired by traditional capture-the-flag, but extends it into a larger space with more complex rules.

The winner of a game of terries is the player who controls the most zones when time runs out. Each zone has a flag somewhere in it, and the zone can be captured by moving a unit to stand adjacent to the flag. It will slowly turn your color over time. 

If two opposing units meet in an un-claimed zone, nothing happens to either unit. If they meet in a zone controlled by one player, the enemy unit is frozen and unable to move for a period of time.

Each player can only see enemy units that are in the same zone as them. Flag capture and zone ownership are globally visible. Enemy unit starting positions are also visible.

Installation
------------

1. install nodejs
1. `npm install`
1. `npm start` (you'll want to run it manually to specify port and hostname, relatively straightfoward)
1. load http://host:port/game. First client to connect is player 1, second client to connect is player 2. Server must be restarted between games, and if either player disconnects. Shaky I know, but easier for prototyping.