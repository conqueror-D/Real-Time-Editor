import React from "react";

const Message = () => {
  return (
    <div className={`chat-bubble`}>
      <img className="chat-bubble__left" src="" alt="user avatar" />
      <div className="chat-bubble__right">
        <p className="user-name">Shyam Pawar</p>
        <p className="user-message">
          building a real time chat app with React and Firebase.
        </p>
      </div>
    </div>
  );
};

export default Message;
