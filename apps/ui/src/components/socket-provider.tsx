import React, { useEffect } from "react";
import SocketIO, { type Socket } from "socket.io-client";

export const socket = SocketIO({
  withCredentials: true,
  transports: ["websocket"],
  retries: Infinity,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 5000,
  autoConnect: false
}).connect();

export const SocketContext = React.createContext<any>(undefined);

export function SocketProvider({ children }: { children: any }) {
  const [connected, setConnected] = React.useState(false);

  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        console.log("connected");
        setConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("disconnected");
        setConnected(false);
      });

      socket.on("error", (err) => {
        console.log("error", err);
      });

      socket.on("message", (data) => {
        console.log("message", data);
      });
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socket, isConnected: connected }}>
      {children}
    </SocketContext.Provider>
  );
}
