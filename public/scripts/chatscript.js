const socket = io('/')

const roomContainer = document.getElementById('room-container')
const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

var user = '';
if (messageForm != null) {
  const userName = prompt('What is your name?')
  appendMessage('You joined')
  user = userName;
  socket.emit('new-user', roomName, userName)

  messageForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', roomName, userName, message)
    messageInput.value = ''
  })
}

socket.on('room-created', room => {
  const roomElement = document.createElement('div');
  roomElement.innerText = room;

  const roomLink = document.createElement('a')
  roomLink.href = `/${room}`
  roomLink.innerText = 'join'

  roomContainer.append(roomElement)
  roomContainer.append(roomLink)
})

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-connected', data => {
  if(user === data.user && data.inCall)
    appendHtml(`<a href='${window.location.href}/${videoRoom}'>Join the call</a>`);
  else
    appendMessage(`${data.user} connected`) 
})

// socket.on('video-connected', data => {
//   appendMessage(`${data.name} : JOIN -> ${window.location.href}\\${data.videoId}`)
// })

socket.on('user-disconnected', (name, videoId) => {
  if(videoId)
    appendHtml(`${name} : <a href='${window.location.href}/${videoId}'>Join</a>`)
  else 
    appendMessage(`${name} has left the room`)
})

function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}

function appendHtml(htmlText)
{
  const messageElement = document.createElement('div')
  messageElement.innerHTML = htmlText
  messageContainer.append(messageElement)
}