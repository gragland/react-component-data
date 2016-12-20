import React from 'react';

export function isClient(){
  return typeof window !== 'undefined';
}

export function getScript(data){
  return ( data && <script id='COMPONENT_DATA_PAYLOAD' type='application/json' dangerouslySetInnerHTML={{__html: safeStringify(data)}}></script> );
}

export function getScriptData(){
  const payloadElement = document.getElementById('COMPONENT_DATA_PAYLOAD');
  return (payloadElement ? JSON.parse(payloadElement.innerHTML) : null);
}

function safeStringify(obj){
  return (obj ? JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--') : null);
}

