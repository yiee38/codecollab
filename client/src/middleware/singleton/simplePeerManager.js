// simplePeerManager.js
import SimplePeer from 'simple-peer';
import socket from '../../webrtc/socket';

let peerInstance = null;
let remoteStream = null;


export const sendData = (data) => {
  if (peerInstance) {
    //console.log("setn? ")
    peerInstance.send(data)

  }
}


export const getSimplePeerInstance = (initiator, trickle, stream, roomID) => {
  if (initiator){
    console.log("initiator")
  }

  if (!peerInstance) {
    console.log("creating new peer instance")
    peerInstance = new SimplePeer({
      initiator: initiator,
      trickle: trickle,
      stream: stream,
    });

    peerInstance.on('signal', (data) => {
      console.log("signaling here")
      socket.emit('offer', data, roomID); // Emit offer or answer to server
    });
  
    
    socket.on('offer', (offer) => {
      console.log("received an offer")
      console.log(peerInstance)
      try {
       
          peerInstance.signal(offer); // Signal the offer
        
      } catch (e) {
        console.log(e)
      }
    });
  
    socket.on('answer', (answer) => {
      //console.log("received an answer")
      
      peerInstance.signal(answer); // Signal the answer
    });
    
  
    socket.on('ice-candidate', (candidate) => {
      peerInstance.signal(candidate); // Signal the ICE candidate
    });
  
  
    
  
    peerInstance.on('stream', stream => {
      console.log("streaming")
      remoteStream = stream
    })
  
    peerInstance.on('close', () => {
      console.log("closed")
      socket.emit("socket closed")
    })

    peerInstance.on('data', function (data) {
      console.log(data)
    })

    peerInstance.on('error', function (err) {
      console.log('error', err)
      console.log('error might be destroying a peer')
    
    })
    
  }
  // Signaling events
  

  

  return peerInstance;
};

export const addPeerEventListener = (eventName, eventHandler) => {
  if (peerInstance) {
    peerInstance.on(eventName, eventHandler);
  } else {
    console.error("Peer instance not initialized.");
  }
};

export const addOncePeerEventListener = (eventName, eventHandler) => {
  if (peerInstance) {
    peerInstance.once(eventName, eventHandler);
  } else {
    console.error("Peer instance not initialized.");
  }
};

export const existingPeerInstance = () => {
  return peerInstance !== null;
};


export const getRemoteStream = () => {
  return remoteStream
}

export const closePeerConnection = () => {
  if (peerInstance) {
    peerInstance.destroy();
    peerInstance = null;
  }
};