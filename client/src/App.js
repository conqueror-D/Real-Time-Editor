import { createBrowserRouter, RouterProvider } from "react-router-dom";
import JoinRoom from "./routes/joinRoom/JoinRoom";
import Room from "./routes/room/Room";
import SocketWrapper from "./components/SocketWrapper";
import HomeComponent from "./components/Home/HomeComponent";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeComponent />,
  },
  {
    path: "/room",
    element: <JoinRoom />,
  },
  {
    path: "/room/:roomId",
    element: (
      <SocketWrapper>
        <Room />
      </SocketWrapper>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
