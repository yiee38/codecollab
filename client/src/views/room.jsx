import React, {useEffect, useRef, useContext, useState} from "react";
import socket from '../webrtc/socket';
import { useParams, useNavigate } from "react-router-dom";
import MediaStreamContext from "../MediaStreamContextProvider";
import { getSimplePeerInstance, closePeerConnection, addOncePeerEventListener, existingPeerInstance } from "../middleware/singleton/simplePeerManager";
import Editor from "../components/Editor";
import Videos from "../components/Videos";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense
} from "@liveblocks/react/suspense";

export default function RoomView (props) {
    const {role, roomID} = useParams();
    const { mediaStream, setMediaStream,  } = useContext(MediaStreamContext);
    const idRef = useRef(null);
    const [userId, setUserId] = useState(null);
    const [peerConnected, setPeerConnected] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
      const getUserMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: {width: "160px", heigth: "120px"} });
          setMediaStream(stream);
        } catch (error) {
          console.error('Error accessing user media:', error);
        }
      };
  
  
      getUserMedia();
    }, [setMediaStream]);

    useEffect(() => {
      if (role && role !== "interviewer" && role !== "interviewee"){
        navigate("/", { state: { message: `Invalid role ${role}` } })
      }
    }, [role])
    
    useEffect(() => {
      if (role, roomID){
        if (mediaStream !== null) {
          //interviewers is 1 and interviewee is 2
          socket.emit("request room", roomID, role);
            socket.on("room full", () => {
              navigate("/", { state: { message: `Room ${roomID} is full` } })
            })
            socket.on("role taken", () => {
              navigate("/", { state: { message: `Your selected role as ${role} is taken by someone else`  } })
            })
            
            socket.on("restart connection", (data)=> {
              if (data.state === "disconnected"){
                const peer = answer(data.callerId, data.callerSig, mediaStream, roomID);
                peer.signal(data.offer)
              }
              addOncePeerEventListener("connect", () => {
                
                console.log('CONNECT')
                
                socket.emit("request editor", roomID)
                
                setPeerConnected(true);
              })
                //closePeerConnection();
                //const peer = answer(data.callerId, data.callerSig, mediaStream, roomID);
                //idRef.current = data.role;
            })

            socket.on("room response", (data)=> {
              const num = data.num;
              const uid = data.role === "interviewer" ? 1 : 2;
              let peer;
              if (num === 2){
                
                peer = call(data.partner, socket.id, mediaStream, roomID);
                idRef.current = data.role;
                

              }
              else {

                peer = answer(data.callerId, data.callerSig, mediaStream, roomID);
              
                idRef.current = data.role;
                
              }
              setUserId(uid);

              addOncePeerEventListener("connect", () => {
                
                console.log('CONNECT')
                
                socket.emit("request editor", roomID)
                
                setPeerConnected(true);
              })
            })

            socket.on("stream end", () => {
              console.log("close this stream!")
              setPeerConnected(false);
              closePeerConnection();
            })
            //Interviewer created room
            /*
            socket.on("created", (data) => {
              const peer = answer(data.callerId, data.callerSig, mediaStream, roomID);
              
              console.log("created room " + data.roomId);
              idRef.current = data.role;
              setUserId(data.role);
            });

            //Interviewee joined room
            socket.on("joined", (data) => {
              const peer = call(data.partner, socket.id, mediaStream, roomID);
              idRef.current = data.role;
              setUserId(data.role);

            });
            */
          }
        }

      return () => {
        closePeerConnection();
        socket.off("room full")
        socket.off("role taken")
        socket.off("room response")
        socket.off("stream end")
        socket.off("restart connection")

      }

    }, [role, roomID, mediaStream]);

    const call = (receiverId, fromId, s, room) => {
      const caller = getSimplePeerInstance(
        true,
        false,
        s, 
        room,
      );
      return caller;
    }
  
    const answer = (callerId, callerSig, s, room) => {
      const receiver = getSimplePeerInstance(
        false, 
        false,
        s, 
        room
      );
      return receiver;
    }

    return (
      <React.Fragment>
       
              <div style={{display: "flex", flexDirection: 'column', width: "100%", height: '100%', alignItems:"center"}}>
                <h4 style={{marginBottom: '0', paddingBottom: '0'}}>
                  You are: {role === "interviewer" ? "Interviewing": "Being interviewed"}
                </h4>

                <Videos peerConnected={peerConnected}></Videos>
                <Editor userId={userId}></Editor>
              </div>
            
      </React.Fragment>
      //<div>Hi</div>
    )
}
/*

<LiveblocksProvider publicApiKey={"pk_prod_dN0l9abCRmNCWp3G2-C3fwYTAYGX6iTdmDFpd8qxgzpCx2BtYTXspFy29OWgimCJ"}>
      <RoomProvider id="my-room">

      </RoomProvider>
    </LiveblocksProvider>
    */