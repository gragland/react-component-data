import React from 'react';

function safeStringify(obj){
  return (obj ? JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--') : null);
}

export function getScript(data){
  return ( data && <script id='COMPONENT_DATA_PAYLOAD' type='application/json' dangerouslySetInnerHTML={{__html: safeStringify(data)}}></script> );
}

