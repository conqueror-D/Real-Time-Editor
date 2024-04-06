import React from "react";
import { io } from 'socket.io-client';
import "./joinReq.css";
const socket = io('http://localhost:5000');

const JoinReq = ({ userId, guestName, roomId, onRes }) => {
    const onYesClick = () => {
        console.log("Yes");
        onRes(true);
        socket.emit("response_from_creator", { res: true, roomId: roomId });
    }
    const onNoClick = () => {
        console.log("No");
        onRes(false);
        socket.emit("response_from_creator", { res: false, roomId: roomId });
    }

    return (
        <div className="confirmation-dialog">
            <p className="dialog-text">{guestName} wants to join this room...</p>
            <div className="button-container">
                <button onClick={onYesClick} className="yes-button">Yes</button>
                <button onClick={onNoClick} className="no-button">No</button>
            </div>
        </div>
    );
};

export default JoinReq;
