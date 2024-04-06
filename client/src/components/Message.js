import React from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import "./Message.css";

const Message = ({ message }) => {
  const [user] = useAuthState(auth);
  const isSender = message.uid === user.uid;

  return (
    <div className={`chat-bubble ${isSender ? "right" : ""}`}>
      <img
        className="chat-bubble__left"
        src={message.avatar}
        alt="user avatar"
      />
      <div className="chat-bubble__right">
        <p className="user-name">{message.name}</p>
        <p className="user-message">{message.text}</p>
      </div>
    </div>
  );
};

export default Message;
