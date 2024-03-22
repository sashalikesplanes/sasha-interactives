import { DeepChat } from 'deep-chat-react';
import { useRef, useEffect } from 'react';
import hljs from 'highlight.js';

export default function Chat({ apiUrl, wsApiUrl }) {
  window.hljs = hljs;
  const chatRef = useRef(null);
  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.onComponentRender = () => { chatRef.current.focusInput(); }
    chatRef.current.onNewMessage = (message) => {
      chatRef.current.disableSubmitButton();
    }
  }, [chatRef])



return (
  <>
    <h1>SashaChat</h1>
    <DeepChat
      ref={chatRef}
      client:only="react"
      style={{
        border: 'none',
        width: '100%',
        maxWidth: '600px',
        height: '100%',
      }}
      request={{
        url: wsApiUrl,
        websocket: true
      }}
      stream={{ simulation: "$$$stream-end$$$"}}
      requestBodyLimits={{ maxMessages: 1 }}
      introMessage={{ text: `Hallo! Ik ben jouw Nederlandse tutor. Ik zal met je een interessant gesprek voeren en tegelijkertijd feedback geven op jouw Nederlandse antwoorden. Laten we beginnen!` }}
      audio={true}
      images={true}
      gifs={true}
      camera={true}
      microphone={true}
      mixedFiles={true}
      responseInterceptor={(response) => {
        if (response.text === '$$$stream-end$$$') {
          chatRef.current.disableSubmitButton(false);
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              chatRef.current.disableSubmitButton(false);
            }, i * 10);
          }
        }
        return response;
      }}
      requestInterceptor={(response) => {
        return response;
      }}
      textInput={{ placeholder: { text: 'Say hello to SashaChat!' } }}
    />
  </>
)
}
