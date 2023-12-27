import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mysql from "mysql";
import { writeFile } from "fs";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: {
        origin: 'http://localhost',
        methods: ['GET', 'POST'],
        credentials: true,
    } 
});
/*const server = app.listen(8000, () => {
  console.log('Server is running on port 3000');
});*/

/*const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'hardik123',
    database: 'message_box',
});*/
/*const connection = mysql.createPool({
    connectionLimit : 100,
    host: '154.41.233.10',
    port: 3306,
    user: 'u854821893_messagebox',
    password: '@0V@PKbt',
    database: 'u854821893_messagebox',
});*/
const connection = mysql.createPool({
    connectionLimit : 100,
    host: '154.41.233.10',
    port: 3306,
    user: 'u854821893_messagebox',
    password: '@0V@PKbt',
    database: 'u854821893_messagebox'
});
/*connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database: ', err);
        return;
    }
    console.log('Connected to MySQL database');
});*/

/*app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});*/
let onlineUsers = [];

io.on("connection", (socket) => {
    console.log('New user connected');
    socket.on('join_chat', function (data) {
        console.log('User Join:-'+data.user_id);
        socket.join(data.user_id); // We are using room of socket io
        if (!onlineUsers.some((user) => user.userId === data.user_id)) {  // if user is not added before
          onlineUsers.push({ userId: data.user_id, socketId: socket.id });
          console.log("new user is here!", onlineUsers);
        }
    });
    socket.on('typing', (data) => {
        io.sockets.in(data.user_id).emit('istyping', data);
    });
    // Handle chat events
    socket.on('message_read', (data) => {
        connection.query('UPDATE chat_conversion SET isread = ? WHERE chats_id = ? AND user_id = ? AND isread=0',[1,data.chats_id,data.user_id], function (error, results3, fields){
            io.sockets.in(data.user_id).emit('message_seen', {'chats_id': data.chats_id,'seen' : true});
        });
    });

    socket.on('send_message', (data) => {
        console.log('send message');
        // Save the chat message to MySQL database
        // Broadcast the message to all connected clients

        connection.query('SELECT * FROM `chats` WHERE sender_id = ? AND receiver_id = ?',[data.sender_id, data.receiver_id], function (error, results, fields){
            if (error) {
                console.log("error ocurred",error);
            }else{
                console.log('Resultats1: ', results);
                if(results.length==0){
                    connection.query('SELECT * FROM `chats` WHERE sender_id = ? AND receiver_id = ?',[data.receiver_id, data.sender_id], function (error, results2, fields){
                        if (error) {
                            console.log("error ocurred",error);
                        }else{
                            console.log('Resultats2:',results2);
                            if(results2.length==0){
                                connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,data.sender_id, data.receiver_id, data.message], function (error, results5, fields){
                                    if (error) {
                                        console.log("error ocurred",error);
                                    }else{
                                        console.log('Resultats2: ', results5);
                                        connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results5.insertId, data.sender_id, data.message], function (error, results6, fields){
                                        });
                                    }
                                });
                            }else{
                                connection.query('UPDATE chats SET message = ? WHERE id = ?',[data.message,results2[0].id], function (error, results7, fields){});
                                connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results2[0].id, data.sender_id, data.message], function (error, results8, fields){});
                            }
                        }
                    });
                }else{
                    // connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,data.sender_id, data.receiver_id, data.message], function (error, results, fields){
                    connection.query('UPDATE chats SET message = ? WHERE id = ?',[data.message,results[0].id], function (error, results3, fields){});
                    connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results[0].id, data.sender_id, data.message], function (error, results4, fields){});
                    // console.log("Possible kumes: " + results[0].id);
                }
            }
        });
        /*connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,data.sender_id, data.receiver_id, data.message], function (error, results, fields){
            if (error) {
                console.log("error ocurred",error);
            }else{
                console.log('Resultats: ', results);
                connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results.insertId, data.sender_id, data.message], function (error, results, fields){
                    if (error) {
                        console.log("error ocurred",error);
                    }else{
                        console.log('Resultats: ', results);
                    }
                });
            }
        });*/

        io.sockets.in(data.receiver_id).emit('receive_message', data);

        // io.emit('message', data);
    });
    socket.on('send_group_message', (data) => {
        console.log('send message');
        // Save the chat message to MySQL database
        // Broadcast the message to all connected clients
        connection.query('SELECT * FROM `chats` WHERE id = ?',[data.chat_id], function (error, results, fields){
            if (error) {
                console.log("error ocurred",error);
            }else{
                console.log('Result: ', results);
                connection.query('UPDATE chats SET message = ? WHERE id = ?',[data.message,data.chat_id], function (error, results1, fields){});
                connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,data.chat_id, data.sender_id, data.message], function (error, results2, fields){});
            }
        });
        /*connection.query('SELECT * FROM `chats` WHERE sender_id = ? AND receiver_id = ?',[data.sender_id, data.receiver_id], function (error, results, fields){
            if (error) {
                console.log("error ocurred",error);
            }else{
                console.log('Resultats1: ', results);
                if(results.length==0){
                    connection.query('SELECT * FROM `chats` WHERE sender_id = ? AND receiver_id = ?',[data.receiver_id, data.sender_id], function (error, results2, fields){
                        if (error) {
                            console.log("error ocurred",error);
                        }else{
                            console.log('Resultats2:',results2);
                            if(results2.length==0){
                                connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,data.sender_id, data.receiver_id, data.message], function (error, results5, fields){
                                    if (error) {
                                        console.log("error ocurred",error);
                                    }else{
                                        console.log('Resultats2: ', results5);
                                        connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results5.insertId, data.sender_id, data.message], function (error, results6, fields){
                                        });
                                    }
                                });
                            }else{
                                connection.query('UPDATE chats SET message = ? WHERE id = ?',[data.message,results2[0].id], function (error, results7, fields){});
                                connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results2[0].id, data.sender_id, data.message], function (error, results8, fields){});
                            }
                        }
                    });
                }else{
                    // connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,data.sender_id, data.receiver_id, data.message], function (error, results, fields){
                    connection.query('UPDATE chats SET message = ? WHERE id = ?',[data.message,results[0].id], function (error, results3, fields){});
                    connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results[0].id, data.sender_id, data.message], function (error, results4, fields){});
                    // console.log("Possible kumes: " + results[0].id);
                }
            }
        });*/

        const members = data.members.split(',');
        console.log(members);
        members.forEach(element => { 
            if(element!=data.sender_id){
                io.sockets.in(parseInt(element)).emit('receive_group_message', data);
            }
        });
    });
    socket.on("online", (data, callback) => {
        // remove user from active users
        var isonline;
        if (onlineUsers.some((user) => user.userId === data.user_id)) {
            isonline = true;
            console.log("user is online!");
        }else{
            isonline = false;
            console.log('offline');
        }
        callback({ online: isonline });
        // send all online users to all users
    });
    socket.on("offline", () => {
        // remove user from active users
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
        console.log("user is offline", onlineUsers);
        // send all online users to all users
    });

  // Handle disconnect event
    socket.on('disconnect', () => {
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
        console.log("user disconnected", onlineUsers);
        console.log('User disconnected');
    });

    socket.on("send_media", (data, callback) => {
        console.log(data);
        
        var media = data.file;
        var fileName = 'user'+Date.now() +data.name;
        var sender_id = data.sender_id;
        var receiver_id = data.receiver_id;
        var filetype = data.filetype;
        // var fileName = 'user'+Date.now() + "image.webm";
                
        // writeFile("public/uploads/chatmedia/" + fileName, media, {encoding: 'base64'}, function(err){
        // var fileurl = 'http://localhost/dating_app/public/uploads/chatmedia/'+fileName;
        var fileurl = 'http://45.132.241.45/public/uploads/chatmedia/'+fileName;
        writeFile("public/uploads/chatmedia/" + fileName, media, function(err){
            if(err){
                console.log(err);
            }else{
                connection.query('SELECT * FROM `chats` WHERE sender_id = ? AND receiver_id = ?',[sender_id, receiver_id], function (error, results, fields){
                    if (error) {
                        console.log("error ocurred",error);
                    }else{
                        console.log('Resultats1: ', results);
                        if(results.length==0){
                            connection.query('SELECT * FROM `chats` WHERE sender_id = ? AND receiver_id = ?',[receiver_id, sender_id], function (error, results2, fields){
                                if (error) {
                                    console.log("error ocurred",error);
                                }else{
                                    console.log('Resultats2:',results2);
                                    if(results2.length==0){
                                        connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,sender_id, receiver_id,filetype], function (error, results5, fields){
                                            if (error) {
                                                console.log("error ocurred",error);
                                            }else{
                                                console.log('Resultats2: ', results5);
                                                connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`,`file`, `filetype`) VALUES (?, ?, ?, ?, ?, ?)',[0,results5.insertId, data.sender_id,'',fileName, filetype], function (error, results6, fields){
                                                });
                                            }
                                        });
                                    }else{
                                        connection.query('UPDATE chats SET message = ? WHERE id = ?',[filetype,results2[0].id], function (error, results7, fields){});
                                        connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`,`file`, `filetype`) VALUES (?, ?, ?, ?, ?, ?)',[0,results2[0].id, data.sender_id,'',fileName, filetype], function (error, results8, fields){});
                                    }
                                }
                            });
                        }else{
                            // connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,data.sender_id, data.receiver_id, data.message], function (error, results, fields){
                            connection.query('UPDATE chats SET message = ? WHERE id = ?',[filetype,results[0].id], function (error, results3, fields){});
                            connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`,`file`, `filetype`) VALUES (?, ?, ?, ?, ?, ?)',[0,results[0].id, data.sender_id,'',fileName, filetype], function (error, results4, fields){});
                            // console.log("Possible kumes: " + results[0].id);
                        }
                    }
                });

                io.sockets.in(data.receiver_id).emit('receive_message', {'file' : fileurl, 'filetype' : filetype});
                callback({ message: err ? "failure" : "success" });
            }
        });
    });
    socket.on('send_group_media', (data, callback) => {
        console.log(data);
        
        var media = data.file;
        var fileName = 'user'+Date.now() +data.name;
        var sender_id = data.sender_id;
        var filetype = data.filetype;
        // var fileName = 'user'+Date.now() + "image.webm";
                
        // writeFile("public/uploads/chatmedia/" + fileName, media, {encoding: 'base64'}, function(err){
        // var fileurl = 'http://localhost/dating_app/public/uploads/chatmedia/'+fileName;
        var fileurl = 'http://45.132.241.45/public/uploads/chatmedia/'+fileName;
        writeFile("public/uploads/chatmedia/" + fileName, media, function(err){
            if(err){
                console.log(err);
            }else{
                connection.query('SELECT * FROM `chats` WHERE id = ?',[data.chat_id], function (error, results, fields){
                    if (error) {
                        console.log("error ocurred",error);
                    }else{
                        console.log('Resultats1: ', results);
                        
                        connection.query('UPDATE chats SET message = ? WHERE id = ?',[filetype,data.chat_id], function (error, results1, fields){});
                        connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`,`file`, `filetype`) VALUES (?, ?, ?, ?, ?, ?)',[0,data.chat_id, data.sender_id,'',fileName, filetype], function (error, results2, fields){});
                    }
                });

                // io.sockets.in(data.receiver_id).emit('receive_group_message', {'file' : fileurl, 'filetype' : filetype});
                const members = data.members.split(',');
                members.forEach(element => { 
                    if(element!=data.sender_id){
                        io.sockets.in(parseInt(element)).emit('receive_group_message', {'chat_id':data.chat_id,'file' : fileurl, 'filetype' : filetype});
                    }
                });
                callback({ message: err ? "failure" : "success" });
            }
        });
    });

    socket.on("send_call", (data, callback) => {
        console.log(data);
        
        var sender_id = data.sender_id;
        var receiver_id = data.receiver_id;
        var channel_id = data.channel_id;
        var calltype = data.calltype;
        if(calltype=='audio'){
            var message = 'Start Audio Call';
        }else if(calltype=='video'){
            var message = 'Start Video Call';
        }
        var sender_user_data = [];
        var fileurl = 'http://localhost/dating_app/public/uploads/profile/';
        // var fileurl = 'http://45.132.241.45/public/uploads/profile/';
        

        connection.query('SELECT * FROM `chats` WHERE sender_id = ? AND receiver_id = ?',[sender_id, receiver_id], function (error, results, fields){
            if (error) {
                console.log("error ocurred",error);
            }else{
                console.log('Resultats1: ', results);
                if(results.length==0){
                    connection.query('SELECT * FROM `chats` WHERE sender_id = ? AND receiver_id = ?',[receiver_id, sender_id], function (error, results2, fields){
                        if (error) {
                            console.log("error ocurred",error);
                        }else{
                            console.log('Resultats2:',results2);
                            if(results2.length==0){
                                connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,sender_id, receiver_id,message], function (error, results5, fields){
                                    if (error) {
                                        console.log("error ocurred",error);
                                    }else{
                                        console.log('Resultats2: ', results5);
                                        connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message``) VALUES (?, ?, ?, ?)',[0,results5.insertId, data.sender_id,message], function (error, results6, fields){
                                        });
                                    }
                                });
                            }else{
                                connection.query('UPDATE chats SET message = ? WHERE id = ?',[message,results2[0].id], function (error, results7, fields){});
                                connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results2[0].id, data.sender_id,message], function (error, results8, fields){});
                            }
                        }
                    });
                }else{
                    // connection.query('INSERT INTO chats (`id`, `sender_id`, `receiver_id`, `message`) VALUES (?, ?, ?, ?)',[0,data.sender_id, data.receiver_id, data.message], function (error, results, fields){
                    connection.query('UPDATE chats SET message = ? WHERE id = ?',[message,results[0].id], function (error, results3, fields){});
                    connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,results[0].id, data.sender_id,message], function (error, results4, fields){});
                    // console.log("Possible kumes: " + results[0].id);
                }
            }
        });
        var username = '';
        var profile = '';
        connection.query('SELECT firstname,lastname,profile FROM `app_users` WHERE id = ?',[sender_id], function (error, results, fields){
            if(results){
                // sender_user_data = results;
                username = results[0].firstname+' '+results[0].lastname;
                profile = fileurl+results[0].profile;
                io.sockets.in(data.receiver_id).emit('receive_call', {'sender_id': sender_id,'channel_id' : channel_id, 'calltype' : calltype,'username' : username,'profile' : profile});
            }
        });

        // io.sockets.in(data.receiver_id).emit('receive_call', {'channel_id' : channel_id, 'calltype' : calltype,'username' : username,'profile' : profile});
        callback({ message: "start calling"});
            
    });

    socket.on("send_calldecline", (data, callback) => {
        console.log(data);
        
        var sender_id = data.sender_id;
        var receiver_id = data.receiver_id;
        var channel_id = data.channel_id;

        io.sockets.in(data.receiver_id).emit('receive_calldecline', {'sender_id': sender_id,'channel_id' : channel_id});
        callback({ message: "Call Disconnect"});
    });

    socket.on("send_group_call", (data, callback) => {
        console.log(data);
        
        var sender_id = data.sender_id;
        var chat_id = data.chat_id;
        var channel_id = data.channel_id;
        var calltype = data.calltype;
        if(calltype=='audio'){
            var message = 'Start Audio Call';
        }else if(calltype=='video'){
            var message = 'Start Video Call';
        }
        var sender_user_data = [];
        var fileurl = 'http://localhost/dating_app/public/uploads/profile/';
        // var fileurl = 'http://45.132.241.45/public/uploads/profile/';
        
        var group_name = '';
        var profile = '';

        connection.query('SELECT * FROM `chats` WHERE id = ?',[chat_id], function (error, results, fields){
            if (error) {
                console.log("error ocurred",error);
            }else{
                console.log('Resultats1: ', results);
                connection.query('UPDATE chats SET message = ? WHERE id = ?',[message,chat_id], function (error, results1, fields){});
                connection.query('INSERT INTO chat_conversion (`id`, `chats_id`, `user_id`, `message`) VALUES (?, ?, ?, ?)',[0,chat_id, data.sender_id,message], function (error, results2, fields){});

                group_name = results[0].group_name;
                // profile = fileurl+results[0].profile;

                const members = results[0].members.split(',');
                members.forEach(element => {
                    if(element!=data.sender_id){
                        io.sockets.in(parseInt(element)).emit('receive_group_call', {'chat_id':chat_id,'sender_id': sender_id,'channel_id' : channel_id, 'calltype' : calltype,'group_name' : group_name,'profile' : profile});
                    }
                });
            }

        });
        // io.sockets.in(data.receiver_id).emit('receive_call', {'channel_id' : channel_id, 'calltype' : calltype,'username' : username,'profile' : profile});
        callback({ message: "start group calling"});
            
    });
});
httpServer.listen(3000);
