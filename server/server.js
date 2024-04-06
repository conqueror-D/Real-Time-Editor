const app = require("express")();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { createPool } = require('mysql');

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
app.get("/", function (req, res) {
  res.send("Hello from the server!");
})

// DB*****
const connection = createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'code_editor'
})

//Getting creatorId from meeting id
app.get('/getCreator/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log("Room id is:", roomId);

    const creatorId = await findCreatorId(roomId);
    console.log(creatorId);
    res.json({ creatorId });
  } catch (error) {
    console.error('Error fetching creatorId:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function findCreatorId(roomId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT userId FROM meetingstocreator WHERE meetId = ?';
    connection.query(sql, [roomId], (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        reject(err);
        return;
      }
      if (results.length === 0) {
        // Consider how you want to handle this case, e.g., throw an error or return null
        resolve(null);
        return;
      }
      const creatorId = results[0].userId;
      // console.log('Creator ID:', creatorId);
      resolve(creatorId);
    });
  });
}

async function findUserName(userId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT userName FROM userinfo WHERE userId = ?';
    connection.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        reject(err);
        return;
      }
      if (results.length === 0) {
        // Consider how you want to handle this case, e.g., throw an error or return null
        resolve(null);
        return;
      }
      const userName = results[0].userName;
      resolve(userName);
    });
  });
}

app.get('/getRoomName/:roomId', (req, res) => {
  const { roomId } = req.params;
  console.log("Room id is:", roomId);
  const sql = 'SELECT meetName FROM meetinginfo WHERE meetId = ?';
  connection.query(sql, [roomId], (err, results) => {
    if (err) {
      console.log("PPRRRR LOOSER");
      console.log(err);
      return
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }
    const rName = results[0].meetName;
    // console.log('Room name:', rName);
    res.json({ rName });
  });
});

// //INSERTING INTO THE DB
app.post('/database', async function (req, res) {
  const { roomId, roomName, uid, username } = req.body;
  const insertUser = 'INSERT INTO userInfo (userId, userName) VALUES (?, ?)';
  const insertNewMeeting = 'INSERT INTO meetinginfo (meetId, meetName) VALUES (?, ?)';

  try {
    // Check if user already exists
    const userRows = await query('SELECT * FROM userInfo WHERE userId = ?', [uid]);
    if (userRows.length === 0) {
      await query(insertUser, [uid, username]);
    }
    // Check if meeting already exists
    const meetingRows = await query('SELECT * FROM meetinginfo WHERE meetId = ?', [roomId]);
    if (meetingRows.length === 0) {
      await query(insertNewMeeting, [roomId, roomName]);
    }
    // Insert into meetingstocreator
    if (roomName) {
      console.log("I am joining: ", roomName);
      await query('INSERT INTO meetingstocreator (meetId, userId) VALUES (?, ?)', [roomId, uid]);
    }

    console.log('Data inserted successfully');
    res.status(200).send('Data inserted successfully');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

function query(sql, values) {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

const socketID_to_Users_Map = {};
const roomID_to_Code_Map = {};

async function getUsersinRoom(roomId, io) {
  const socketList = await io.in(roomId).allSockets();
  const userslist = [];
  socketList.forEach((each) => {
    each in socketID_to_Users_Map &&
      userslist.push(socketID_to_Users_Map[each].username);
  });
  return userslist;
}

async function updateUserslistAndCodeMap(io, socket, roomId) {
  socket.in(roomId).emit("member left", {
    username: socketID_to_Users_Map[socket.id].username,
  });

  // update the user list
  delete socketID_to_Users_Map[socket.id];
  const userslist = await getUsersinRoom(roomId, io);
  socket.in(roomId).emit("updating client list", { userslist: userslist });

  userslist.length === 0 && delete roomID_to_Code_Map[roomId];
}

//Whenever someone connects this gets executed
io.on("connection", function (socket) {
  console.log("A user connected", socket.id);

  socket.on("when a user joins", async ({ roomId, username }) => {
    console.log("username: ", username);
    socketID_to_Users_Map[socket.id] = { username };
    socket.join(roomId);

    const userslist = await getUsersinRoom(roomId, io);
    // for other users, updating the client list
    socket.in(roomId).emit("updating client list", { userslist: userslist });

    // for this user, updating the client list
    io.to(socket.id).emit("updating client list", { userslist: userslist });

    // send the latest code changes to this user when joined to existing room
    if (roomId in roomID_to_Code_Map) {
      io.to(socket.id).emit("on language change", {
        languageUsed: roomID_to_Code_Map[roomId].languageUsed,
      });
      io.to(socket.id).emit("on code change", {
        code: roomID_to_Code_Map[roomId].code,
      });
    }
    console.log("Username: ", username, " roomId: ", roomId);
    // alerting other users in room that new user joined
    socket.in(roomId).emit("new member joined", {
      username,
    });
  });

  // for other users in room to view the changes
  socket.on("update language", ({ roomId, languageUsed }) => {
    if (roomId in roomID_to_Code_Map) {
      roomID_to_Code_Map[roomId]["languageUsed"] = languageUsed;
    } else {
      roomID_to_Code_Map[roomId] = { languageUsed };
    }
  });

  socket.on("join_room_request", async ({ roomId, userId }) => {
    const creatorId = await findCreatorId(roomId);
    const guestName = await findUserName(userId);
    socket.in(roomId).emit("join_req_to_user", { creatorId, userId, guestName });
  })

  socket.on("response_from_creator", async ({ res, roomId }) => {
    console.log("Room ID used for emitting:", roomId);
    io.emit("creators_response", { res, roomId });
    console.log("done");
  })

  // for user editing the code to reflect on his/her screen
  socket.on("syncing the language", ({ roomId }) => {
    if (roomId in roomID_to_Code_Map) {
      socket.in(roomId).emit("on language change", {
        languageUsed: roomID_to_Code_Map[roomId].languageUsed,
      });
    }
  });

  // for other users in room to view the changes
  socket.on("update code", ({ roomId, code }) => {
    if (roomId in roomID_to_Code_Map) {
      roomID_to_Code_Map[roomId]["code"] = code;
    } else {
      roomID_to_Code_Map[roomId] = { code };
    }
  });

  // for user editing the code to reflect on his/her screen
  socket.on("syncing the code", ({ roomId }) => {
    console.log("Editing in " + roomId);
    if (roomId in roomID_to_Code_Map) {
      socket
        .in(roomId)
        .emit("on code change", { code: roomID_to_Code_Map[roomId].code });
    }
  });

  socket.on("leave room", ({ roomId }) => {
    socket.leave(roomId);
    updateUserslistAndCodeMap(io, socket, roomId);
  });

  socket.on("disconnecting", (reason) => {
    socket.rooms.forEach((eachRoom) => {
      if (eachRoom in roomID_to_Code_Map) {
        updateUserslistAndCodeMap(io, socket, eachRoom);
      }
    });
  });

  //Whenever someone disconnects this piece of code executed
  socket.on("disconnect", function () {
    console.log("A user disconnected");
  });
});

//you can store your port number in a dotenv file, fetch it from there and store it in PORT
//we have hard coded the port number here just for convenience
const PORT = process.env.PORT || 5000;

server.listen(PORT, function () {
  console.log(`listening on port : ${PORT}`);
});