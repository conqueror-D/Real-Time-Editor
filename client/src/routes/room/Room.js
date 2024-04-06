import { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate, useParams } from "react-router-dom";
import { generateColor } from "../../utils";
import './Room.css';
import LiveChatBar from "./LiveChatBar";
import { useLocation } from 'react-router-dom';
import { auth } from "../../firebase";
import JoinReq from "../../components/joinReq";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";

import "ace-builds/src-noconflict/keybinding-emacs";
import "ace-builds/src-noconflict/keybinding-vim";

import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";

export default function Room({ socket }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [uid, setUid] = useState("");
  const { roomId } = useParams();
  const [roomName, setRoomName] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [fetchedUsers, setFetchedUsers] = useState(() => [])
  const [fetchedCode, setFetchedCode] = useState(() => "")
  const [language, setLanguage] = useState(() => "javascript")
  const [codeKeybinding, setCodeKeybinding] = useState(() => undefined)
  const [requestToJoin, setRequestToJoin] = useState(false);
  const [guestId, setGuestId] = useState("");
  const [gName, setGName] = useState("");

  const languagesAvailable = ["javascript", "java", "c_cpp", "python", "typescript", "golang", "yaml", "html"];
  const codeKeybindingsAvailable = ["default", "emacs", "vim"];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth) {
          const currentUser = auth.currentUser.displayName;
          const currentId = auth.currentUser.uid;
          if (currentUser && currentId) {
            setUid(currentId);
          };
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  //Fetching room name and creator id from database
  useEffect(() => {
    const fetchCreatorId = async () => {
      try {
        const response = await fetch(`http://localhost:5000/getCreator/${roomId}`);
        const data = await response.json();;
        setCreatorId(data.creatorId);
      } catch (error) {
        console.error('Error fetching creatorId:', error);
      }
    };
    const fetchRoomName = async () => {
      try {
        const response = await fetch(`http://localhost:5000/getRoomName/${roomId}`);
        const data = await response.json();
        setRoomName(data.rName);
      } catch (error) {
        console.error('Error fetching creatorId:', error);
      }
    }
    if (roomId) {
      fetchRoomName();
    }
    if (roomId && roomName) {
      fetchCreatorId();
    }
  }, [roomId, roomName]);

  useEffect(() => {
    const { username } = location.state || {};
    setUserName(username);
  }, [location.state]);

  function onChange(newValue) {
    setFetchedCode(newValue)
    socket.emit("update code", { roomId, code: newValue })
    socket.emit("syncing the code", { roomId: roomId })
  }

  function handleLanguageChange(e) {
    setLanguage(e.target.value)
    socket.emit("update language", { roomId, languageUsed: e.target.value })
    socket.emit("syncing the language", { roomId: roomId })
  }

  function handleCodeKeybindingChange(e) {
    setCodeKeybinding(e.target.value === "default" ? undefined : e.target.value)
  }

  function handleLeave() {
    socket.disconnect()
    !socket.connected && navigate('/', { replace: true, state: {} })
  }

  function copyToClipboard(text) {
    try {
      console.log('Username:', userName);
      console.log("Uid: ", uid);
      console.log('Room ID: ', roomId);
      console.log("Creator id: ", creatorId);
      navigator.clipboard.writeText(text);
      toast.success('Room ID copied');
    } catch (exp) {
      console.error(exp)
    }
  }
  useEffect(() => {
    socket.on("updating client list", ({ userslist }) => {
      setFetchedUsers(userslist)
    })

    socket.on("on language change", ({ languageUsed }) => {
      setLanguage(languageUsed)
    })

    socket.on("join_req_to_user", ({ creatorId, userId, guestName }) => {
      setGuestId(userId);
      setGName(guestName);
      if (creatorId === uid) {
        setRequestToJoin(true);
      }
    })

    socket.on("on code change", ({ code }) => {
      setFetchedCode(code)
    })

    socket.on("new member joined", ({ username }) => {
      toast(`${username} joined`)
    })

    socket.on("member left", ({ userName }) => {
      console.log(userName);
      toast(`${userName} left`)
    })

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
  }, [socket, uid])

  const handleRes = (res) => {
    setRequestToJoin(false);
  }

  return (
    <div className="room">

      <div className="roomSidebar">
        <div className="roomSidebarUsersWrapper">
          <div className="languageFieldWrapper">
            <select className="languageField" name="language" id="language" value={language} onChange={handleLanguageChange}>
              {languagesAvailable.map(eachLanguage => (
                <option key={eachLanguage} value={eachLanguage}>{eachLanguage}</option>
              ))}
            </select>
          </div>

          <div className="languageFieldWrapper">
            <select className="languageField" name="codeKeybinding" id="codeKeybinding" value={codeKeybinding} onChange={handleCodeKeybindingChange}>
              {codeKeybindingsAvailable.map(eachKeybinding => (
                <option key={eachKeybinding} value={eachKeybinding}>{eachKeybinding}</option>
              ))}
            </select>
          </div>

          <p>Connected Users:</p>
          <div className="roomSidebarUsers">
            {fetchedUsers.map((each) => (
              <div key={each} className="roomSidebarUsersEach">
                <div className="roomSidebarUsersEachAvatar" style={{ backgroundColor: `${generateColor(each)}` }}>{each.slice(0, 2).toUpperCase()}</div>
                <div className="roomSidebarUsersEachName">{each}</div>
              </div>
            ))}
          </div>
        </div>
        {requestToJoin && (
          <JoinReq
            userId={guestId}
            guestName={gName}
            roomId={roomId}
            onRes={handleRes}
          />
        )}
        <div>
          {"Room name: " + roomName}
        </div>
        <button className="roomSidebarCopyBtn" onClick={() => { copyToClipboard(roomId) }}>Copy Room id</button>
        <button className="roomSidebarBtn" onClick={() => {
          handleLeave()
        }}>Leave</button>
      </div>
      <iframe title="Code Board" src="https://codeboard.netlify.app" className="roomCodeEditor" />
      <Toaster />
      <div className="chatsidebar">
        <LiveChatBar />
      </div>
    </div>
  )
}
