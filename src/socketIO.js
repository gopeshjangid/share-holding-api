/* eslint-disable no-console */
const socketIO = (io) => {
    io.on('connection', (socket) => {
        socket.join('CHATROOM');
        //console.log("SOCKET CONNECTED room ID");
        // Listen for new messages
        socket.on('NEW_MESSAGE', (data) => {
            console.log('new message recieved', data);
            socket.broadcast.to('CHATROOM').emit('NEW_MESSAGE', data);
        });

        // Leave the room if the user closes the socket
        socket.on('disconnect', () => {
            socket.leave('CHATROOM');
            console.log('A disconnection has been made');
        });
    });
};

export default socketIO;
