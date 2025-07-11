import { useRef, useEffect, useState } from 'react';

function useWebSocket(url, { onMessage } = {}) {
  const [connectionState, setConnectionState] = useState('CLOSED');
  const ws = useRef(null);
  const messageQueue = useRef([]);

  useEffect(() => {
    return () => {
      closeWebSocket();
    };
    // eslint-disable-next-line
  }, [url]);

  const flush = () => {
    if (ws.current && ws.current.readyState === window.WebSocket.OPEN) {
      messageQueue.current.forEach(msg => ws.current.send(JSON.stringify(msg)));
      messageQueue.current = [];
    }
  };

  const connectWebSocket = () => {
    console.log('creating WebSocket', url);
    ws.current = new window.WebSocket(url);

    setConnectionState('CONNECTING');
    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
      setConnectionState('OPEN');
      flush();
    };
    ws.current.onmessage = (event) => {
      if (onMessage) {
        onMessage(JSON.parse(event.data));
      }
    };
    ws.current.onclose = () => {
      setConnectionState('CLOSED');
    };
    ws.current.onerror = () => {
      setConnectionState('ERROR');
    };
  };

  const closeWebSocket = () => {
    if (ws.current && ws.current.readyState === window.WebSocket.OPEN) {
      ws.current.close();
      setConnectionState('CLOSED');
    }
  };

  const send = (data) => {
    messageQueue.current.push(data);
    if (!ws.current || ws.current.readyState === window.WebSocket.CLOSED) {
      connectWebSocket();
    } else {
      flush();
    }
  };

  return { send, closeWebSocket, connectionState };
}

export default useWebSocket;
