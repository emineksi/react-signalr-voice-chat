// Chat.tsx
import * as signalR from "@microsoft/signalr";
import React, { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("https://localhost:7024/chatHub")
  .withAutomaticReconnect()
  .build();

const Chat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const {
    transcript,
    finalTranscript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const stopListeningAndSend = () => {
    console.log("Transcribed Text: ", transcript);
    if (transcript.trim() !== "") {
      SpeechRecognition.stopListening();
      handleSendMessage(transcript);
      resetTranscript();
    }
  };

  useEffect(() => {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
      connection
        .start()
        .then(() => {
          console.log("Connected!");

          connection.on("ReceiveMessage", (message) => {
            console.log("Received message: ", message);
            setMessages((prevMessages) => [...prevMessages, message]);

            setTimeout(() => {
              SpeechRecognition.startListening({ continuous: true });
            }, 1000);
          });

          SpeechRecognition.startListening({ continuous: true });
        })
        .catch((err) => console.error("Connection failed: ", err));
    }
  }, []);

  useEffect(() => {
    if (listening) {
      const timer = setTimeout(() => {
        console.log("Stopping listening and sending message");
        stopListeningAndSend();
      }, 3000); // 3 saniye boyunca sessizlik algılandığında tetiklenir
      return () => clearTimeout(timer);
    }
  }, [transcript, listening]);

  const handleSendMessage = (message: string) => {
    setMessages((prevMessages) => [...prevMessages, message]);
    connection
      .invoke("SendMessage", message)
      .catch((err) => console.error(err.toString()));
  };

  return (
    <div>
      {messages.map((msg, index) => (
        <p key={index}>{msg}</p>
      ))}

      <div>
        <h2>{listening ? "Dinleniyor..." : "Dinleme durdu."}</h2>
        <p>Transkript: {transcript}</p>
      </div>
    </div>
  );
};

export default Chat;
