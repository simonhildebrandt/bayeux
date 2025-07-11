import { useState, useEffect } from 'react';
import { useBayeuxConnection } from './bayeux-connection-context';
import useBayeuxValue from './use-bayeux-value';

function useBayeuxChildren(key) {
  const { value } = useBayeuxValue(`${key}#children`);

  return { children: value };
}

export default useBayeuxChildren;
