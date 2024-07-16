// MediaStreamContext.js
import React, { createContext, useState } from 'react';

const MediaStreamContext = createContext();

export const MediaStreamProvider = ({ children }) => {
  const [mediaStream, setMediaStream] = useState(null);
  //const [localAudioStream, setLocalAudioStream] = useState(null);

  return (
    <MediaStreamContext.Provider value={{ mediaStream, setMediaStream }}>
      {children}
    </MediaStreamContext.Provider>
  );
};

export default MediaStreamContext;