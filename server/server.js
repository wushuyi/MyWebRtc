/**
 * Created by Administrator on 2015/1/28.
 */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var Emitter = require('component-emitter');

app.use(express.static(path.join(__dirname, '../static')));

app.all('*', function(req, res, next){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Power-By', 'wushuyi');
    res.removeHeader('X-Powered-By');
    next();
});

var p2p = {};

io.on('connection', function (socket) {
    socket.on('getId', function(e){
        var myId = socket.id;
        socket.emit('getId',  {
                id: myId
            });
    });
    socket.on('setId', function(e){
        console.log(e.id);
        socket.id = e.id;
    });
    socket.on('reqSetOtherId', function(e){
        p2p[socket.id] = e.id;
        p2p[e.id] = socket.id;
        socket.to(p2p[socket.id]).emit('resSetOtherId', {
                id: socket.id
            });
    });
    socket.on('reqNeedPeer', function(e){
        console.log(p2p[socket.id]);
        socket.to(p2p[socket.id]).emit('resNeedPeer', e);
    });
    socket.on('reqOffer', function(e){
        socket.to(p2p[socket.id]).emit('resOffer', e);
    });
    socket.on('reqAnswer', function(e){
        socket.to(p2p[socket.id]).emit('resAnswer', e);
    });
    socket.on('reqIce', function(e){
        socket.to(p2p[socket.id]).emit('resIce', e);
    });
    socket.on('reqClose', function(e){
        socket.to(p2p[socket.id]).emit('resClose', e);
    });
});

server.listen(3000);