var app = require('express')();
var server = app.listen(8080, function () { console.log('Listening on port 8080') });
var io = require('socket.io')(server);

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

var clients = {};
var currentClient = null;
io.on('connection', function (socket) {
  clients[socket.id] = { socket: socket };
  console.log('Accepting new connection from ' + socket.id);
  console.log(Object.keys(clients).length + ' client(s) connected.');

  if (currentClient === null) {
    rotateControls();
  }

  socket.on('disconnect', function() {
    if (Object.keys(clients).length === 1) {
      currentClient = null;
    } else if (currentClient === socket) {
      rotateControls();
    }

    console.log('Closing connection from ' + socket.id);
    delete clients[socket.id];
  });

  socket.on('controls update', function (action) {
    if (socket === currentClient) {
      console.log(action.action + ' ' + action.direction);
    } else {
      socket.emit('log', 'You have not the controls');
    }
  });
});

function rotateControls() {
  var clientIds = Object.keys(clients);

  if (clientIds.length < 2) {
    console.log('No client connected or only one, not rotating controls.');
    return;
  }

  if (currentClient === null) {
    var newIndex = 0;
  } else {
    var clientIds = Object.keys(clients),
      currentIndex = clientIds.indexOf(currentClient.id),
      newIndex = (currentIndex + 1) % clientIds.length;
  }

  currentClient = clients[Object.keys(clients)[newIndex]].socket;
  currentClient.emit('log', 'You have the controls');
  console.log('Givin controls to client with id ' + currentClient.id);
}

setInterval(rotateControls, 5000);
