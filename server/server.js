const path = require('path');
const express = require('express');
const app = express();

var cors = require('cors')
// Enable json
app.use(express.json());

// Enable CORS
app.use(cors());

const socketIO = require('socket.io');

const multer = require('multer');
const mysql = require('mysql2');
const fs = require('fs');
const uuid = require('uuid').v4;


//import { Server } from "socket.io"
//import * as http from "http"
//import { ChangeSet, Text } from "@codemirror/state"
const {ChangeSet, Text} = require("@codemirror/state")
require('dotenv').config();

const port = process.env.PORT || 8080;

const env = process.env.NODE_ENV || 'development';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'video_recordings');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


// Set up storage and file naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Directory to save the uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // File naming convention
  }
});

const upload = multer({ storage: storage });

/*

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'yilu',
  password: '19990308'
});


db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
  db.query('USE techinterview', (err) => {
    if (err) throw err;
    console.log('Database selected')
  });

  db.query('CREATE DATABASE IF NOT EXISTS techinterview', (err) => {
    if (err) throw err;
    console.log('Database created or exists');

    // Use the database
    db.query('USE techinterview', (err) => {
      if (err) throw err;

      // Create table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS video_metadata (
          id INT AUTO_INCREMENT PRIMARY KEY,
          originalName VARCHAR(255),
          uploadName VARCHAR(255),
          uploadTime DATETIME,
          size BIGINT,
          mimeType VARCHAR(50)
        )
      `;
      db.query(createTableQuery, (err) => {
        if (err) throw err;
        console.log('Table created or exists');
      });
    });
  });

});
*/
var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}


// Route to handle file upload
app.post('/upload_record', upload.single('file'), (req, res) => {
  const file = req.file;
  const interview_id = req.body.interview_id; // Assuming interview_id is sent in the request body

  // Get file metadata

  const filePath = 'video_recordings/' + file.filename;
  const mimeType = file.mimetype;
  const user_id = req.body.user_id;

  //const sql = `INSERT INTO videos (interview_id, user_id, file_path, mime_type) VALUES (?, ?, ?, ?)`;
  
  /*
  db.query(sql, [interview_id, user_id, filePath, mimeType], (err, result) => {
    if (err) {
      console.error('Error inserting metadata into the database:', err);
      return res.status(500).json({ error: 'Failed to save metadata' });
    }
    res.json({ message: 'File uploaded and metadata saved', file: file, metadata: result });
  });*/


});
/*
// Route to serve video files
app.post('/create_interview', cors(corsOptions),  (req, res) => {
  const sql = 'INSERT INTO interviews (duration, start_time) VALUES (NULL, NULL)';

  db.query(sql, [req.created_at, req.duration], (err, result) => {
    if (err) throw err;
    const interviewID = result.insertId;
    res.json({ interview_id: interviewID });
  });
});


app.post('/end_interview/:id', cors(corsOptions), (req, res) => {
  const { id } = req.params;

  const { duration, startTime, codeChanges } = req.body;

  const sql = 'UPDATE interviews SET duration = ?, start_time = ? WHERE interview_id = ?';
  const codeSql = 'INSERT INTO code_changes (interview_id, code_changes) VALUES (?, ?)';
  console.log(codeChanges)
  db.query(sql, [duration, startTime, id], (err, result) => {
      if (err) throw err;
      db.query(codeSql, [id, codeChanges], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Interview updated successfully' });
        
      });
  });
});

app.get('/get_interview/:id', cors(corsOptions), (req, res) => {
  const videoSQL = `SELECT * FROM videos WHERE interview_id = ?`;
  const interview_id = req.params.id;
  db.query(videoSQL, [interview_id], (err, results) => {
    if (err) {
      console.error('Error fetching video metadata from the database:', err);
      return res.status(500).json({ error: 'Failed to fetch video metadata' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ videos: results});
  });

});
*/
//initiailize roomCollab, should be replaced by mongodb in the futures
let roomCollab = {}

app.get('/get_comment', (req, res) => {
  const roomId = req.query.roomId;
  console.log("get comments")
  console.log(roomCollab[roomId])
  if (roomCollab[roomId] && roomCollab[roomId]['comments']) {
    console.log(roomCollab[roomId]['comments'].toString())
    res.json({comment: roomCollab[roomId]['comments'].toString()});
  }
  else {
    console.log("no comment")
    res.json({comment: ""})
  }
});

// Redirect to https
app.get('*', (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && env !== 'development') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

app.use(express.static(path.join(__dirname, 'build')));
app.use('/video_recordings', express.static(path.join(__dirname, 'video_recordings/')));





app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});




const server = require('http').createServer(app);
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});

const origin = process.env.RUNNING === 'local' ?  '*' : ['https://tech-interview.netlify.app']

/**
 * Socket.io events
 */
const io = socketIO(server, {
  cors: {
  origin: '*',
  methods: [ "GET", "POST" ]
}
});



app.post('/update_comment', (req, res) => {
  /*
  socket.on("getDocument", (roomId) => {
    console.log("got")

    socket.emit("getDocumentResponse", roomCollab[roomId]['updates'].length, roomCollab[roomId]['doc'].toString())
    
  })
  */
 /*
  const roomId = req.body.roomId;
  const comment = req.body.comment;
  const commentTime = req.body.time;
  const line = req.body.line;
  */
  const comment = req.body.comment;
  const roomId = req.body.roomId
    console.log(req.body);
  
  roomCollab[roomId]['comments'] = comment;
  console.log("updated comment!", comment)
  res.json({message: 'Comment updated successfully'});
})


io.on('connection', socket => {
  socket.on("hello", () => {
    socket.emit("hello rsp")
  })


  socket.on("request room", (roomId, roomRole) => {

    const detailedRole = roomRole === "interviewer" ? "interviewer" : "interviewee";
    console.log(detailedRole)
    console.log(roomCollab[roomId])
    if (roomCollab[roomId]){
      console.log("Room exists: " + roomId);

      if (roomCollab[roomId]['num'] >= 2){
        socket.emit("room full")
      }
      else if (roomCollab[roomId][detailedRole]){
        socket.emit("role taken")
      }
      else {
        roomCollab[roomId][detailedRole] = socket.id;

        socket.join(roomId)
        if (roomCollab[roomId]['num'] === 1){
          /*
          const party = [...io.sockets.adapter.rooms.get(roomId)];
      const partner = party.filter((id) => {return id!==socket.id});
      console.log("Room joined: " + roomId);
      socket.emit("joined", {id: socket.id, roomId: roomId, party: party, partner: partner, role: 2});
          
          */
          const party = [...io.sockets.adapter.rooms.get(roomId)];
          const partner = party.filter((id) => {return id!==socket.id});
          console.log("Room joined: " + roomId);
          roomCollab[roomId]['num']+=1;
          socket.emit("room response", {id: socket.id, roomId: roomId, party: party, partner: partner, role: detailedRole, state: roomCollab[roomId]['state'], num: roomCollab[roomId]['num']});
          oppositeRole = detailedRole === "interviewer" ? "interviewee" : "interviewer";
          

        }else {
          
          console.log("room existed, num 0")
          roomCollab[roomId]['num']+=1;
          
          socket.emit("room response", {id: socket.id, roomId: roomId, role: detailedRole, state: roomCollab[roomId]['state'], num: roomCollab[roomId]['num']});
          roomCollab[roomId]['state']="preparing";
          
        }
        
      }
    }
    else {
      
      roomCollab[roomId] = {doc: Text.of(["/*Start working here*/\n"]), pending: [], updates: [], state: "preparing", num: 1, interviewer: null, interviewee: null}
      if (detailedRole === "interviewer"){
        roomCollab[roomId]['interviewer'] = socket.id;
      }else {
        roomCollab[roomId]['interviewee'] = socket.id;
      }
      socket.join(roomId);
      console.log("Room created: " + roomId);
      socket.emit("room response", {id: socket.id, roomId: roomId, role: detailedRole, state: "preparing", num: 1});
      
    }
    
  })

  socket.on("request editor", (roomId) => {
    //socket.emit("code ready")
    io.to(roomId).emit("code ready");
  })

  socket.on("made a call", (data) => {
    io.to(data.receiverId).emit('received a call', {callerId: data.fromId, callerSig: data.callerSig});
  })

  socket.on("answered a call", (data) => {
    io.to(data.callerId).emit('call answered', {receiverId: socket.id, receiverSig: data.receiverSig});
  })

  socket.on('request code', (room) => {
    const [firstId] = io.sockets.adapter.rooms.get(room);
    io.to(firstId).emit('need code', socket.id);
  })

  socket.on('request replay', (room)=>{
    const [firstId] = io.sockets.adapter.rooms.get(room);
    io.to(firstId).emit('ready for replay', socket.id);
    socket.emit('ready for replay interviewee', socket.id);
    //io.to(data.receiverId).emit('ready for replay', {requesterId: data.fromId, requesterSig: data.requesterSig});
  })

  socket.on('sending replay', (data) => {  
    io.to(data.requesterId).emit('receiving replay', {recorderSig: data.recorderSig})
  })

  socket.on('give code', (data) => {
    //console.log(data.code);
    //console.log(data.receiver)
    io.to(data.receiver).emit('incoming code', data);
  })

  socket.on("disconnecting", () => {
    console.log("disconnected")
    socket.rooms.forEach(user => {
      if (user !== socket.id){
        if (roomCollab[user]){
          roomCollab[user]['num']-=1;
          roomCollab[user]['state'] = "disconnected";
          if (roomCollab[user]['interviewer'] === socket.id){
            roomCollab[user]['interviewer'] = null;
          } else if (roomCollab[user]['interviewee'] === socket.id){
            roomCollab[user]['interviewee'] = null;
          }
        }
        io.to(user).emit("stream end", socket.id);
      }
    });
    
  });

  socket.on("joinRoom", (roomId) => {
    const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
    let numClients = clientsInRoom ? clientsInRoom.size : 0;
    if (numClients > 2) {
      socket.emit("roomFull");
    }
    else {
      socket.emit("roomAvailable", roomId);
    }
  })

  socket.on("hit replay", (blob) => {
    socket.rooms.forEach(user => {
      if (user !== socket.id){
        io.to(user).emit("replay received", blob);
      }
    });
  })

  socket.on("end replay", () => {
    socket.rooms.forEach(user => {
      if (user !== socket.id){
        io.to(user).emit("replay ended");
      }
    });
  })


  socket.on("pullUpdates", (version, roomId) => {
    console.log("pulled")

    if (version < roomCollab[roomId]['updates'].length) {
      socket.emit("pullUpdateResponse", JSON.stringify(roomCollab[roomId]['updates'].slice(version)))
    } else {
      roomCollab[roomId]['pending'].push(updates => {
        socket.emit(
          "pullUpdateResponse",
          JSON.stringify(updates.slice(version))
        )
      })
    }
  })

  socket.on("pushUpdates", (version, docUpdates, roomId) => {
    docUpdates = JSON.parse(docUpdates)
    console.log("pushed")

    try {
      if (version != roomCollab[roomId]['updates'].length) {
        socket.emit("pushUpdateResponse", false)
      } else {
      for (let update of docUpdates) {
        let changes = ChangeSet.fromJSON(update.changes)
        //console.log("request from socket id: "+socket.id)
        //console.log("Changes: " + changes)
        roomCollab[roomId]['updates'].push({ changes, clientID: update.clientID, effects: update.effects, caret: update.caret })
        //console.log("Before" + roomCollab[roomId]['doc'] )
        roomCollab[roomId]['doc'] = changes.apply(roomCollab[roomId]['doc'])
        //console.log("After" + roomCollab[roomId]['doc'] )

      }
      socket.emit("pushUpdateResponse", true)

      while (roomCollab[roomId]['pending'].length) roomCollab[roomId]['pending'].pop()(roomCollab[roomId]['updates'])
      }
    } catch (error) {
      console.error(error)
    }
  })

  socket.on("getDocument", (roomId) => {
    console.log("got")

    socket.emit("getDocumentResponse", roomCollab[roomId]['updates'].length, roomCollab[roomId]['doc'].toString())
    
  })

  socket.on("reset", ()=>{
    //roomCollab[0] = {doc: Text.of(["/*Start working here*/\n"]), pending: [], updates: []}

    socket.emit("resetResponse")
  })

  socket.on("record started", () => {
    io.to(0).emit("editable")
  })

  socket.on('offer', (offer, roomID) => {
    if (roomCollab[roomID]['state'] === "disconnected") {
      console.log("I'm here")
      const party = [...io.sockets.adapter.rooms.get(roomID)];
      const partner = party.filter((id) => {return id!==socket.id});
      console.log("Room joined: " +       roomCollab[roomID]['state']    );
      socket.to(roomID).emit('restart connection', {offer: offer, id: socket.id, roomId: roomID, party: party, partner: partner, role: oppositeRole, state: roomCollab[roomID]['state'], num: roomCollab[roomID]['num']})
      roomCollab[roomID]['state'] = "preparing";
    }
    else {
      socket.to(roomID).emit('offer', offer); // Broadcast offer to all other clients
    }
    
  });

  socket.on('partner joined', (roomID) => {
    socket.to(roomID).emit('partner joined'); // Broadcast to all other clients
  })

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer); // Broadcast answer to all other clients
  });

  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate); // Broadcast ICE candidate to all other clients
  });

  socket.on('interview id', (interviewID, roomId) => {
    socket.to(roomId).emit('interview id', interviewID);
  })

});