const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Subject } = require('rxjs');
const cors = require('cors');

const app = express();

// enable cors
app.use(cors())

// parse request body as json
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
    }
});

const commandStatus$ = new Subject();

/**
 * Send on or off command to the device
 * 
 * @param {string} command 
 * @returns {void}
 */
function sendCommandToDevice(command) {
    // Simulate streaming data of command status
    // command status: CommandCreated, CommandSent, ServerReceived, ServerPublished, BoardReceived, BoardExecuted, CommandSuccess
    // command status for alternative case - internet connection lost: CommandCreated, CommandSent, ServerReceived, ServerPublished, BoardReceived, BoardExecuted, CommandFailed

    /**
     * CommandSentFailed
     */

    // random failure rate - 20%
    const random = Math.random();
    const status = random < 0.2 ? 'CommandFailed' : 'CommandSuccess';

    // Emit all command status with delay between each status
    setTimeout(() => commandStatus$.next('ServerReceived'), 500)
    setTimeout(() => commandStatus$.next('ServerPublished'), 1000);
    setTimeout(() => commandStatus$.next('BoardReceived'), 10000);
    setTimeout(() => commandStatus$.next('BoardExecuted'), 20000);
    setTimeout(() => commandStatus$.next(status), 25000);

    // Log command to the console
    console.log(`Command: ${command}`);
}

// api to send command to the server
app.post('/v1/light/command', (req, res) => {
    if (!req.body) {
        res.status(400).send('Invalid request');
        return;
    }

    const { command } = req.body;
    if (command !== 'on' && command !== 'off') {
            res.status(400).send('Invalid command');
            return;
    }

    sendCommandToDevice(command);
    res.status(200).send();
})

// websocket connectiont to push command status to the client
io.on('connection', (socket) => {
    console.log('Client connected');

    const subscription = commandStatus$.subscribe((status) => {
        socket.emit('commandStatus', status);
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        subscription.unsubscribe();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});