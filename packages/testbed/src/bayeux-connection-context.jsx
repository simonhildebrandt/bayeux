import React, { createContext, useContext, useRef } from 'react';
import useWebSocket from './use-websocket';
import { createNanoEvents } from 'nanoevents';

const BayeuxConnectionContext = createContext(null);

export function BayeuxConnection({ url, children }) {
  const emitterRef = useRef(createNanoEvents());

  const connection = useWebSocket(url, {
    onMessage: (msg) => {
      console.log({msg})
      emitterRef.current.emit('message', msg);
    }
  });

  const value = { ...connection, events: emitterRef.current };

  return (
    <BayeuxConnectionContext.Provider value={value}>
      {children}
    </BayeuxConnectionContext.Provider>
  );
}

export function useBayeuxConnection() {
  const context = useContext(BayeuxConnectionContext);
  if (!context) {
    throw new Error('useBayeuxConnection must be used within a BayeuxConnection provider');
  }
  return context;
}
