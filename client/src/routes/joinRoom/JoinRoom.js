import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4, validate } from "uuid";
import { auth } from "../../firebase";
import { Toaster, toast } from "react-hot-toast";
import "./JoinRoom.css";

// PopupForm component for creating a new room
const PopupForm = ({ isOpen, onClose, onCreateRoom }) => {
  const [roomName, setRoomName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const currentUser = auth.currentUser.displayName;

  const handleSubmit = (event) => {
    event.preventDefault();
    onCreateRoom(roomName, currentUser, creatorName);
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
            value={currentUser}
            onChange={(e) => setCreatorName(e.target.value)}
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
  const [roomIdToCreatorName, setRoomIdToCreatorName] = useState(new Map());
  const [roomIdToRoomName, setRoomIdToRoomName] = useState(new Map());
  const [changable, setChangable] = useState(false);

  function handleRoomSubmit(e) {
    e.preventDefault();
    if (!validate(roomId)) {
      toast.error("Incorrect room ID");
      return;
    }
    username &&
      navigate(`/room/${roomId}`, {
        state: { username, roomIdToCreatorName, roomIdToRoomName },
      });
  }

  function createRoomId() {
    setIsPopupOpen(true);
    setJoinRoom(false);
  }

  const handleCreateRoom = (roomName, creatorName, userName) => {
    try {
      const id = uuidv4();
      setRoomId(id);
      setUsername(userName);
      setRoomIdToRoomName((prevMap) => new Map(prevMap).set(id, roomName));
      setRoomIdToCreatorName((prevMap) =>
        new Map(prevMap).set(id, creatorName)
      );
      toast.success("Room created: " + roomName);
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

          <button className="joinBoxBtn" type="submit">
            Join
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
      <PopupForm
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
