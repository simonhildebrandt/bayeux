import React, { useState } from 'react';
import { BayeuxConnection, useBayeuxConnection } from './bayeux-connection-context';
import useBayeuxChildren from './use-bayeux-children';
import useBayeuxValue from './use-bayeux-value';


function Value({ path }) {
  const { value } = useBayeuxValue(path);
  return <span>
    { value }
  </span>
}

function ShowKey({path}) {
  const { children } = useBayeuxChildren(path);

  return (
    <div>
      <div>Key: {path == '' ? '<root>' : path} <Value path={path}/></div>
      <ul>
        {children != null && children.map(child => (
          <li key={child}>
            <ShowKey path={`${path}/${child}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}


function Form() {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const { response, send, closeWebSocket, connectionState } = useBayeuxConnection();

  const handleRead = (e) => {
    e.preventDefault();
    send({ action: 'read', path: key });
  };

  const handleWrite = (e) => {
    e.preventDefault();
    send({ action: 'write', path: key, value });
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>WebSocket Redis Testbed</h2>
      <div>
        <strong>Connection state:</strong> {connectionState}
        <button onClick={closeWebSocket} style={{ marginLeft: 16 }}>
          Close Connection
        </button>
      </div>
      <div>
        <strong>Children of root:</strong>
        <ShowKey path="" />
        <ShowKey path="" />
      </div>
      <form>
        <div>
          <label>
            Key:{' '}
            <input
              value={key}
              onChange={e => setKey(e.target.value)}
              style={{ marginRight: 8 }}
            />
          </label>
        </div>
        <div>
          <label>
            Value:{' '}
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              style={{ marginRight: 8 }}
            />
          </label>
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={handleRead} type="button" style={{ marginRight: 8 }}>
            Read
          </button>
          <button onClick={handleWrite} type="button">
            Write
          </button>
        </div>
      </form>
      <div style={{ marginTop: 24 }}>
        <strong>Server response:</strong>
        <pre>{response}</pre>
      </div>
    </div>
  );
}

function App() {
  return (
    <BayeuxConnection url="ws://localhost:8080">
      <Form />
    </BayeuxConnection>
  );
}

export default App;
