import React, { createContext, useContext, useRef } from 'react';
import useWebSocket from './use-websocket';
import { createNanoEvents } from 'nanoevents';

const BayeuxConnectionContext = createContext(null);

export function BayeuxConnection({ url, children }) {
  const emitterRef = useRef(createNanoEvents());

  // Pass onMessage callback to useWebSocket to publish events
  const connection = useWebSocket(url, {
    onMessage: (msg) => {
      emitterRef.current.emit('message', msg);
    }
  });

  // Expose connection and emitter
  const value = { ...connection, emitter: emitterRef.current };

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