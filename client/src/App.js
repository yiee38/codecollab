//import HomeView from "./views/home";
//import ErrorView from "./views/error";
import LoginView from "./views/login";
//import ReviewView from "./views/review";

import { useEffect } from "react";
import { createBrowserRouter, RouterProvider,} from "react-router-dom";
import {MediaStreamProvider} from "./MediaStreamContextProvider";
import RoomView from "./views/room";
import Notepad from "./components/Notepad";



//{process.env.NODE_ENV === 'development' ? process.env.REACT_APP_DEV_MODE : process.env.REACT_APP_PRO_MODE}
/*
<RoomProvider id="my-room" initialPresence={{}}>
      <ClientSideSuspense fallback="Loading…">
        {() => <Editor />}
      </ClientSideSuspense>
    </RoomProvider>
*/
function App() {


  const router = createBrowserRouter([
    {
      path: "/",
      element: 
        <LoginView />,
    },
    {
      path: "/testeditr",
      element: 
        <div style={{width: "300px"}}>
          <Notepad />
        </div>
    },
    //For security reasons, role: 24060 is interviewers and role: 48219 is interviewees
    {
      path: "room/:role/:roomID",
      element: 
        <MediaStreamProvider>
          <RoomView /> 
        </MediaStreamProvider>,
    },
    /*
    {
      path: "review/:interviewId",
      element: 
        <MediaStreamProvider>
            <ReviewView /> 
        </MediaStreamProvider>,
    },
    {
      path: "/error",
      element: <ErrorView />,
    },
    */
  ]);



  return (
    <div className="App" style={{width: '100%', display:'flex', flexDirection: 'row'}}>
      <style type="text/css">
        {`
          .btn-interview {
            background-color: #C76C5B;
            color: #FAFAFA;
          }
          .btn-interview:hover {
            background-color: #a3594c;
            color: #FAFAFA;

          }

          .btn-review {
            background-color: #C75B81;
            color: #FAFAFA;
          }
          .btn-review:hover {
            background-color: #994a66;
            color: #FAFAFA;

          }
          .btn-transcript {
            color: "#FFF";
            underline: "none";
            border: none;

          }
          `}
      </style>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;