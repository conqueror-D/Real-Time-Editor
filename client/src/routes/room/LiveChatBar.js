import React from "react";
import ChatBox from "../../components/ChatBox";
import '../../components/Message.css'

const LiveChatBar = () => {
  return (
    <div className="liveChatBar">
      <ChatBox />
    </div>
  );
};

export default LiveChatBar;
