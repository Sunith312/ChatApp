const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))

const rooms = [];

app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})

app.post('/room', (req, res) => {
  var room = rooms.find(room => room.name == req.body.room);
  if (room === null)
    res.redirect('/');

  rooms.push({ name: req.body.room, users: []});

  res.redirect(req.body.room)
  io.emit('room-created', rooms.filter(room => room.name == req.body.room)[0].name);
})

app.get('/:room', (req, res) => {
  var room = rooms.find(room => room.name == req.params.room);
  if (room == null) {
    return res.redirect('/')
  } else if(room.users.length < 3)
    res.render('room', { room: room })
  else
    return res.redirect('/')
})

app.get('/:room/video', (req, res) => {
  res.redirect(`/${req.params.room}/${uuidV4()}`)
})

app.get('/:room/:video', (req, res) => {
  var room = rooms.find(room => room.name == req.params.room)

  if (room === undefined)
    return res.redirect(`/${req.params.room}`)

  if (room.name === req.params.room) {
    rooms.map((val, index) => {
      if (val.videoId !== req.params.video) {
        val.videoId = req.params.video,
        val.inCall = true
      }
    })
  }
  res.render('video', { room: rooms.find(room => room.name === req.params.room) })
})

server.listen(port, () => console.log('Server started!'))

io.on('connection', socket => {
  socket.on('new-user', (roomName, user) => {
    socket.join(roomName);
    rooms.map((val, index) => {
      // if (val.name === roomName && val.users.length <= 3) {
        if (val.name === roomName) {
        val.users.push({
          name: user,
          id: socket.id
        })
      } 
    });
    io.emit('user-connected', { inCall: rooms.find(room => room.name === roomName).inCall, user: user })
  })

  socket.on('send-chat-message', (roomName, userName, message) => {
    socket.to(roomName).broadcast.emit('chat-message', { message: message, name: userName })
  })

  socket.on('disconnect', () => {
    rooms.forEach(room => {
      var videoroom = room.videoId
      var user = room.users.find(user => user.id === socket.id);
      if (user != undefined) {
        socket.to(room.name).broadcast.emit('user-disconnected', user.name, videoroom)
        if(videoroom === undefined)
          room.users.splice(room.users.indexOf(user), 1);
      }
    })
  })

  socket.on('join-room', (videoId, userId) => {
    socket.join(videoId)
    socket.to(videoId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      //socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})
