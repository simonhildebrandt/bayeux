import { useState, useEffect } from 'react';
import { useBayeuxConnection } from './bayeux-connection-context';

function useBayeuxValue(path) {
  const [value, setValue] = useState(null);
  const { send, events } = useBayeuxConnection();

  useEffect(() => {
    const handleEvent = (event) => {
      if (['read', 'update', 'write'].includes(event.action) && event.path === path) {
        setValue(event.value);
      }
    };

    events.on('message', handleEvent);

    send({action: 'subscribe', path });

    return () => {
      send({action: 'unsubscribe', path });
      events.off('message', handleEvent);
    };
  }, [events])

  useEffect(() => {
    if (path != undefined) {
      send({ action: 'read', path });
    }
  }, [path]);

  return { value };
}

export default useBayeuxValue;
