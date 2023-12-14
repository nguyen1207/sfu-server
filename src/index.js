// server.js
const express = require("express");
const { AccessToken, RoomServiceClient, Room } = require("livekit-server-sdk");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const API_KEY = "devkey";
const API_SECRET = "secret";
const host = "http://localhost:7880";
const roomService = new RoomServiceClient(host, API_KEY, API_SECRET);

const opts = {
  name: "stream-room",
  emptyTimeout: 10 * 60,
  maxParticipants: 300,
};

roomService.createRoom(opts).then((room) => {
  console.log("created room", room.sid);
});

app.get("/get-room-list", async (req, res) => {
  roomService.listRooms().then((rooms) => {
    res.json(rooms);
  });
});

app.get("/delete-room", async (req, res) => {
  const { room } = req.body;
  roomService.deleteRoom(room).then((room) => {
    res.json({ status: "success" });
  });
});

app.get("/get-token", (req, res) => {
  const { room, username } = req.query;

  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: username,
  });
  at.addGrant({ roomJoin: true, room });

  res.json({ data: { token: at.toJwt() } });
});

app.get("/get-participants", async (req, res) => {
  const { room } = req.query;

  const participants = await roomService.listParticipants(room);

  res.json({ data: participants });
});

app.get("/get-participant", async (req, res) => {
  const { room, username } = req.query;

  try {
    const participant = await roomService.getParticipant(room, username);

    res.json({ data: participant });
  } catch (err) {
    if (err.response.status === 404) {
      res.json({ data: null });
    } else {
      throw err;
    }
  }
});

app.get("/leave-room", async (req, res) => {
  const { room, username } = req.query;

  await roomService.removeParticipant({
    room: room,
    identity: username,
  });

  res.json({ status: "success" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
