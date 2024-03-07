import {DeepChat} from 'deep-chat-react';
import { useRef } from 'react';


export default function Chat({ apiUrl, wsApiUrl }) {
  const chatRef = useRef(null);
  chatRef.onComponentRender = () => { chatRef.focusInput(); };



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
            // url: `${apiUrl}/chat-stream`,
            // method: 'POST',
            url: wsApiUrl,
            // url: "wss://49u2tzks9d.execute-api.eu-west-1.amazonaws.com/sasha-dev-1",
            websocket: true
          }}
          requestBodyLimits={{ maxMessages: 1 }}
          introMessage={{ text: 'Welcome to SashaChat how can I help you?' }}
          audio={true}
          images={true}
          gifs={true}
          camera={true}
          microphone={true}
          mixedFiles={true}
          responseInterceptor={(response) => {
            console.log('responseInterceptor')
            console.log(response);
            return response;
          }}
          requestInterceptor={(response) => {
            console.log('requestInterceptor')
            console.log(response);
            return response;
          }}
          textInput={{ placeholder: { text: 'Say hello to SashaChat!' } }}
        />
    </>
  )
}
