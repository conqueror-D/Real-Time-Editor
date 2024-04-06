import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4, validate } from "uuid";
import { auth } from "../../firebase";
import { Toaster, toast } from "react-hot-toast";
import "./JoinRoom.css";
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const LoginForm = ({ isOpen, onClose, onCreateRoom }) => {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (auth.currentUser) {
      const currentUser = auth.currentUser.displayName;
      const currentId = auth.currentUser.uid;
      if (currentUser && currentId) {
        setUserId(currentId);
        setUserName(currentUser);
      };
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Ui: ", userId);
    onCreateRoom(roomName, userId);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="popup-container">
      <div className="popup">
        <h2>Create New Room</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Room creator's name"
            value={userName}
            readOnly
            required
          />
          <button type="submit">Create</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default function JoinRoom() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [joinRoom, setJoinRoom] = useState(true);
  const [changable, setChangable] = useState(false);
  const [roomName, setRoomName] = useState();
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    !alreadyJoined && username && navigate(`/room/${roomId}`, {
      state: { username },
    });
  }, [response])

  useEffect(() => {
    socket.on("creators_response", ({ res, roomId }) => {
      console.log("Received creators_response with roomId:", roomId);
      console.log(res);
      setResponse(res);
    }, []);

    const backButtonEventListner = window.addEventListener("popstate", function (e) {
      const eventStateObj = e.state
      if (!('usr' in eventStateObj) || !('username' in eventStateObj.usr)) {
        socket.disconnect()
      }
    });

    return () => {
      if (socket) {
        socket.off("join_req_to_user");
      }
      window.removeEventListener("popstate", backButtonEventListner)
    }
  }, [socket]);
  useEffect(() => {
    if (auth.currentUser) {
      const currentUser = auth.currentUser.displayName;
      const currentId = auth.currentUser.uid;
      if (currentUser && currentId) {
        setUid(currentId);
        setUsername(currentUser);
      };
      // console.log("User name: " + currentUser + " User id: " + currentId);
    }
  }, [auth.currentUser]);

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!validate(roomId)) {
      toast.error("Incorrect room ID");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomId,
          roomName: roomName,
          uid: uid,
          username: username,
        }),
      });

      if (!roomName) {//This means that this is a meeting attendee and not a creator
        //Sending join request to the creator
        console.log('req sent');
        socket.emit('join_room_request', { roomId: roomId, userId: uid });
      }
      if (roomName && username) {
        setAlreadyJoined(true);
        navigate(`/room/${roomId}`, {
          state: { username },
        });
      }

      // Check if response is successful
      if (!response.ok) {
        throw new Error('Failed to send data to server');
      }

      toast.success('Data sent to server successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send data to server');
    }
    toast.success("Joined " + roomName);
  }

  function createRoomId() {
    setIsPopupOpen(true);
    setJoinRoom(false);
  }

  const handleCreateRoom = (rName, userId) => {
    try {
      const id = uuidv4();
      setRoomId(id);
      setRoomName(rName);
      setUid(userId);
      toast.success("Room created: " + rName);
    } catch (exp) {
      console.error(exp);
    }
  };

  return (
    <div className="joinBoxWrapper">
      {joinRoom && (
        <form className="joinBox" onSubmit={handleRoomSubmit}>
          <img className="homePageLogo" src="../Logo.png" alt="logo" />

          <div className="joinBoxInputWrapper">
            <input
              className="joinBoxInput"
              id="roomIdInput"
              type="text"
              placeholder="Enter Room ID"
              required
              onChange={(e) => {
                setRoomId(e.target.value);
              }}
              value={roomId}
              autoSave="off"
              autoComplete="off"
            />
            <label htmlFor="roomIdInput" className="joinBoxWarning">
              {roomId ? "" : " "}
            </label>
          </div>

          <div className="joinBoxInputWrapper">
            <input
              className="joinBoxInput"
              id="usernameInput"
              type="text"
              placeholder="Enter Username"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              readOnly={changable}
              autoSave="off"
              autoComplete="off"
            />
            <label htmlFor="usernameInput" className="joinBoxWarning">
              {username ? "" : " "}
            </label>
          </div>

          <button className="joinBoxBtn" type="submit" disabled={loading}>
            {loading ? 'Loading ....' : 'Join room'}
          </button>
          <p>
            If you don't have a Room ID, then create a{" "}
            <span
              className="Homelink"
              style={{ textDecoration: "underline", cursor: "pointer" }}
              onClick={createRoomId}
            >
              new room
            </span>
          </p>
        </form>
      )}
      <Toaster />
      <LoginForm
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setJoinRoom(true);
          setChangable(true);
        }}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}
