var express = require('express');
var sys = require("sys");
var util = require('util');
var io = require("socket.io");

app = express.createServer();

app.listen(8080);

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});


var socket = io.listen(app);

var users = {};
var data = [];

socket.on('connection', function(client) {
  // stuff to do on client-connect
  users[client.sessionId] = {
    some: 'thing'
  };

  // it's good to send some initial data
  client.send({ 
    init_data: { 
      users: users
    }
  });

  // callback for handling messages received from the client
  // unlike normal web applications, these do not need to and 
  // do not have the ability of replying directly to the client.
  // to send data backto the client, you use another client.send 
  // call
  client.on('message', function(message){
    // do something with the message the client sends you
    // this is a json object sent from the client
    data.push(message);
    
    // if you want the client to get any response data, you have 
    // to send it to them :)
    client.send({ data: data });

    // you don't need to encapsulate everything in hash-objects, 
    // but if you ever need to add more data to an object (which 
    // happens frequently when continuing development) this makes 
    // it easy to avoid rewriting lots of code
    
    // just so you can see it do something
    console.log(message);
  });

  client.disconnect(function() {
    // remove the reference to the user's object data, referenced 
    // by session id
    delete users[client.sessionId];

    // probably notify everyone else of their leaving as well
    socket.broadcast(users);
    // or
    socket.broadcast({ user_disconnect: client.sessionId });
  });
});



// if you want an update sent every second, you can use socket 
// outside of the socket.on block in a setInterval
setInterval(function() {
    socket.send(data);
}, 1000);
