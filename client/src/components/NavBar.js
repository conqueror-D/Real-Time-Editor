import React from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import "./Navbar.css";

const NavBar = () => {
  const [user] = useAuthState(auth);

  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };
  const signOut = () => {
    auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="nav-bar">
      <h1>Collaborative live Coding</h1>
      {user ? (
        <button onClick={signOut} className="sign-out" type="button">
          Sign Out
        </button>
      ) : (
        <button onClick={googleSignIn} className="sign-in">
          Google Login
        </button>
      )}
    </nav>
  );
};

export default NavBar;
