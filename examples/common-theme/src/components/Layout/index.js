import React from 'react';
/**
* Import component from node_modules, so we can't edit it
*/
import ColorGroup from 'mycomponents/colorgroup';
import Headers from 'mycomponents/headers';

export default function Layout() {
  return (
    <div>
      <ColorGroup />
      <Headers />
    </div>
  );
};
