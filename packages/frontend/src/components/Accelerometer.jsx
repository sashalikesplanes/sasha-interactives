import { DeepChat } from 'deep-chat-react';
import { useRef, useEffect } from 'react';
import hljs from 'highlight.js';

export default function Accelerometer() {
  const [xy, setXy] = useState({ x: 0, y: 0});
return (
  <p>x: {x}, y: {y}</p>
)
}
