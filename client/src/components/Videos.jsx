import React, {useEffect, useRef, useState, useContext} from "react";
//import {useSelector, useDispatch} from "react-redux";
//import { clearFlag } from "./middleware/features/state/timeSlices";
//import {record, stopRecord, setReplayReady} from "./middleware/features/state/stateSlices";
import socket from '../webrtc/socket';
import { getSimplePeerInstance, getRemoteStream, sendData, addPeerEventListener } from "../middleware/singleton/simplePeerManager";
import MediaStreamContext from "../MediaStreamContextProvider";
//import useWhisper from "@chengsokdara/use-whisper";
import { Ratio } from 'react-bootstrap';
import livelogo from "../assets/live.png";
//import {saveAs} from 'file-saver';

function PartyVideo (props) {

  return (
		props.videoRef !== null ? 
			<video 
        autoPlay 
        playsInline 
        ref={props.videoRef} 
        className="scale-x-mirror h-full max-w-1/2 aspect-square object-cover rounded-sm "
        style={{transform: "scaleX(-1)", maxWidth: "30%", height: "150px"}} 
      ></video>
			:
			<div>
				Loading video
			</div>
		
  )
}


function Videos(props) {
  const myVideo = useRef();
  const mediaRecorderRef = useRef(null);
  const remoteRecorderRef = useRef(null);
  const wholeRecordRef = useRef([]);
  const remoteRecordRef = useRef([]);
  const myReplayRef = useRef();
  const remoteReplayRef = useRef();
  const [replay, setReplay] = useState(false);
  const [remoteRecordUrl, setRemoteRecordUrl] = useState(null);
  const [recordUrl, setRecordUrl] = useState(null);
  const peerVideo = useRef(null)
  const { mediaStream, setMediaStream,  } = useContext(MediaStreamContext);

  
  /*
  const {recording: recordingWhisper, speaking, transcribing, transcript, pauseRecording, startRecording, stopRecording}  = useWhisper({
    apiKey: "YOUR_API_KEY", // YOUR_OPEN_AI_TOKEN

    streaming: true,
    timeSlice: 1_000, // 1 second
    whisperConfig: {
      language: 'en',
    },
    removeSilence: true,
    
  })
  */
  
  
/*
  useEffect(() => {
    console.log("play state in videos: ", state)
    if (state === 'Playing') {
      console.log("HELLLLLLLLLLO")
      console.log("Can we get my replay here????")
      setReplay(true)
      try{
        if (myReplayRef.current){
          myReplayRef.current.play();
        }
        if (remoteReplayRef.current){
          remoteReplayRef.current.play();
        }
      }
      catch (e) {
        console.log(e)
      }
    }
    else if (state === 'Continued') {
      console.log("my replay continued")
      
      if (!myReplayRef.current || !remoteReplayRef.current){
        
        setReplay(true)
      }
      try {
        if (myReplayRef.current){

          myReplayRef.current.play();
        }
        if (remoteReplayRef.current){
          remoteReplayRef.current.play();
        }
      }
      catch (e) {
        console.log(e)
      }
    }
    else if (state === 'Paused'){
      console.log("my replay paused")
      try {
        if (myReplayRef.current){
          myReplayRef.current.pause();
        }
        if (remoteReplayRef.current){
          remoteReplayRef.current.pause();
        }
      }
      catch (e) {
        console.log(e)
      }
    }
    else if (state === 'Stopped') {
      try {
        console.log("my replay stopped")
        if (myReplayRef.current){
          myReplayRef.current.pause();
        }
        if (remoteReplayRef.current){
          remoteReplayRef.current.pause();
        }
      }
      catch (e) {
        console.log(e)
      }

      //setReplay(false)
    }
  }, [state])
  */

  /*
   useEffect(() => {
    console.log(userId, interviewId)
    if (interviewId !== null && userId !== null) {
      console.log("get peer videos")
      const peer = getSimplePeerInstance()
      myVideo.current.srcObject = mediaStream;
      console.log(peer.connected)
      console.log(peer.streams)
      if (peer.connected){
        const stream = getRemoteStream();
        peerVideo.current.srcObject = stream;
        const remoteRecorder = new MediaRecorder(stream)
        remoteRecorderRef.current = remoteRecorder;
        remoteRecorder.onstart = () => {
          remoteRecordRef.current = [];
        }
        remoteRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            remoteRecordRef.current.push(e.data)
          }
        }
        remoteRecorder.onstop = () => {
          const remoteUrl = URL.createObjectURL(new Blob(remoteRecordRef.current, {type: 'video/webm'}))
          setRemoteRecordUrl(remoteUrl)

          console.log("remote record blob: ", new Blob(remoteRecordRef.current, {type: 'video/webm'}).size)



          //saveAs(new Blob(remoteRecordRef.current, {type: 'video/webm'}), "remoteRecord.webm")
        }
      }
      console.log(mediaStream.getTracks())
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;
      let chunkText = []

      mediaRecorder.onstart = () => {
        wholeRecordRef.current = [];
      }

      mediaRecorder.ondataavailable = (e) => {
        //const state = mediaRecorder.state

        if (e.data && e.data.size > 0) {
          chunkText.push(e.data)
          wholeRecordRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(wholeRecordRef.current, {type: 'video/webm'}))
        setRecordUrl(url)

        
        if (wholeRecordRef.current) {
          const formData = new FormData();
          formData.append('file', new Blob(wholeRecordRef.current, {type: 'video/webm'}), `user-${userId}-interview-${interviewId}.webm`);
          formData.append('interview_id', interviewId); // Append interview_id
          formData.append('user_id', userId); // Append interview_id
          console.log(formData.get('file'))
    
          fetch('http://localhost:8080/upload_record', {
            method: 'POST',
            body: formData,
          }).then(response => response.json())
            .then(data => console.log(data));
        }
        
      }
      addPeerEventListener('data', (data) => {
        let dataObj;
        try {
          dataObj = JSON.parse(new TextDecoder().decode(data));
        }
        catch (e) {
          dataObj = {};
          console.log("error translating the datas")
          
        }
        if (dataObj["event"] === "record started") {
          console.log("record started")
          dispatch(record());
        }
        else if (dataObj["event"] === "record stoped") {
          dispatch(stopRecord(dataObj['endTime']));
        }
        
        else if (dataObj["event"] === "transcript"){
          setWhispering(true)
          setWhisperText(dataObj.text)
        }
      })
    }
    

  }, [interviewId, userId]);
  */
  useEffect(() => {
    //if (interviewId !== null && userId !== null) {
      if (mediaStream !== null) {
        
        myVideo.current.srcObject = mediaStream;

        /*
        console.log(peer.connected)
        console.log(peer.streams)
        if (peer.connected){
          const stream = getRemoteStream();
          peerVideo.current.srcObject = stream;
          
          const remoteRecorder = new MediaRecorder(stream)
          remoteRecorderRef.current = remoteRecorder;
          remoteRecorder.onstart = () => {
            remoteRecordRef.current = [];
          }
          remoteRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              remoteRecordRef.current.push(e.data)
            }
          }
          remoteRecorder.onstop = () => {
            const remoteUrl = URL.createObjectURL(new Blob(remoteRecordRef.current, {type: 'video/webm'}))
            setRemoteRecordUrl(remoteUrl)

            console.log("remote record blob: ", new Blob(remoteRecordRef.current, {type: 'video/webm'}).size)



            //saveAs(new Blob(remoteRecordRef.current, {type: 'video/webm'}), "remoteRecord.webm")
          }
          
        }*/
        /*
        console.log(mediaStream.getTracks())
        const mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorderRef.current = mediaRecorder;
        let chunkText = []

        mediaRecorder.onstart = () => {
          wholeRecordRef.current = [];
        }

        mediaRecorder.ondataavailable = (e) => {
          //const state = mediaRecorder.state

          if (e.data && e.data.size > 0) {
            chunkText.push(e.data)
            wholeRecordRef.current.push(e.data)
          }
        }

        mediaRecorder.onstop = () => {
          const url = URL.createObjectURL(new Blob(wholeRecordRef.current, {type: 'video/webm'}))
          setRecordUrl(url)

          
          if (wholeRecordRef.current) {
            const formData = new FormData();
            formData.append('file', new Blob(wholeRecordRef.current, {type: 'video/webm'}), `user-${userId}-interview-${interviewId}.webm`);
            formData.append('interview_id', interviewId); // Append interview_id
            formData.append('user_id', userId); // Append interview_id
            console.log(formData.get('file'))
      
            fetch('http://localhost:8080/upload_record', {
              method: 'POST',
              body: formData,
            }).then(response => response.json())
              .then(data => console.log(data));
          }
          
        }
        */
      /*
        addPeerEventListener('data', (data) => {
          let dataObj;
          try {
            dataObj = JSON.parse(new TextDecoder().decode(data));
          }
          catch (e) {
            dataObj = {};
            console.log("error translating the datas")
            
          }
          if (dataObj["event"] === "record started") {
            console.log("record started")
            dispatch(record());
          }
          else if (dataObj["event"] === "record stoped") {
            dispatch(stopRecord(dataObj['endTime']));
          }
          
          else if (dataObj["event"] === "transcript"){
            setWhispering(true)
            setWhisperText(dataObj.text)
          }
        })
        */
      //}
      }
      return () => {
        if (myVideo.current) {
          myVideo.current.srcObject = null;
        }
      }
    

  }, [mediaStream]);

  useEffect(() => {
    if (props.peerConnected){
      const peer = getSimplePeerInstance()

      console.log(peer.connected)
      console.log(peer.streams)
      if (peer.connected){
        const stream = getRemoteStream();
        peerVideo.current.srcObject = stream;
      }
    }


    return () => {
      if (peerVideo.current) {
        peerVideo.current.srcObject = null;
      }
    }
  }, [props.peerConnected])

/*
  useEffect( () => {
    if (whisperState === "Recording") {
      if (peerVideo.current) {
        peerVideo.current.muted = true;
      }
    }
    else if (whisperState === "Stopped") {
      if (peerVideo.current) {
        peerVideo.current.muted = false;
      }
    }
  }, [whisperState])
*/
  /*
  useEffect(() => {
    if (transcript.text){
      console.log(transcript.text)
      sendData(JSON.stringify({event: "transcript", text: transcript.text}))
    }
  }, [transcript.text])
  */
/*
  useEffect(() => {
    //console.log("seeked", seekValue);
    if (!replay && seeked && state !== "Unstarted" && state !== "Stopped") {
      setReplay(true)
    }
    if (myReplayRef.current ) {
      console.log(seekValue)
      myReplayRef.current.currentTime = seekValue/1000;
      remoteReplayRef.current.currentTime = seekValue/1000;
    }
    dispatch(clearFlag());
  }, 
  [seeked, replay, state])
*/
/*
  useEffect(() => {
    if (recording) {
      wholeRecordRef.current = [];
      mediaRecorderRef.current.start();
      remoteRecorderRef.current.start();
    }
    else {
      if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      }
      if (remoteRecorderRef.current) {
      remoteRecorderRef.current.stop();
      }


      
    }
  }, [recording])
  */
 /*

  useEffect(() => {
    if ( replay && myReplayRef.current && remoteReplayRef.current) {
      if (mute){
        console.log(mute)
        myReplayRef.current.muted = true;
        remoteReplayRef.current.muted = true;
      }
      else {
        myReplayRef.current.muted = false;
        remoteReplayRef.current.muted = false;
      }
    }
  }, [mute, replay])
*/

/**
 replay

 {false && replay &&
        <div style={{display:'flex', flexDirection: "column", justifyContent: "space-between", gap: "3px"}}>

          <span style={{fontSize: "0.8rem"}}>Replay: </span>

          <div style={{display: 'flex', flexDirection: 'row', left: "35%", gap: "10px"}}>
            <div style={{height: 'auto', width: 130}}>
              <Ratio aspectRatio='1x1'>
                <video 
                  //autoPlay={true}
                  playsInline 
                  ref = {myReplayRef}
                  src = {recordUrl}
                  
                  onCanPlay={()=> {
                    //console.log("can play");
                    dispatch(setReplayReady())
                  }}
                  style={{transform: "scaleX(-1)", objectFit: "cover"}} 
                />
              </Ratio>
            </div>
            <div style={{height: 'auto', width: 130}}>
              <Ratio aspectRatio='1x1'>
                <video 
                  //autoPlay={true}
                  playsInline 
                  ref = {remoteReplayRef}
                  src = {remoteRecordUrl}
                  
                  onCanPlay={()=> {
                    //console.log("can play");
                  }}
                  style={{transform: "scaleX(-1)", objectFit: "cover"}} 
                />
              </Ratio>
            </div>
          </div>
        </div>
      }
 */
  return (
    <div style={{display: "flex", flexDirection: "row", width: "1150px", gap: `${replay? "385px":20}` }}>
      <div style={{ display:'flex', flexDirection: "column", justifyContent: "space-between",gap: "3px", }}>
        <div style={{width: "30px"}}>
          <img src={livelogo} style={{width: "100%", height: "auto"}} alt="Live"/>
        </div>
        <div style={{display: 'flex', flexDirection: 'row', gap: "10px"}}>
          <div style={{height: 'auto', width: 130}}>
            <Ratio aspectRatio='1x1'>
              <video 
                autoPlay 
                playsInline 
                ref={myVideo} 
                muted
                style={{transform: "scaleX(-1)", objectFit: "cover"}} 
                //onCanPlay={() => {console.log("Can play!")}}
              ></video>
            </Ratio>
          </div>
          {props.peerConnected && <div style={{height: 'auto', width: 130}}>
            <Ratio aspectRatio='1x1'>
              <video 
                autoPlay 
                playsInline 
                ref={peerVideo} 
                className="scale-x-mirror h-full max-w-1/2 aspect-square object-cover rounded-sm "
                style={{transform: "scaleX(-1)", objectFit: "cover"}} 
                //onCanPlay={() => {console.log("Can play!")}}
              ></video>
            </Ratio>
          </div>}
        </div>
      </div>


    </div>
  )
}

export default Videos;