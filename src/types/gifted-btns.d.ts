declare module 'gifted-btns' {
  const mod: {
    sendButtons: (socket: any, jid: string, payload: any) => Promise<any>;
  };
  export default mod;
  export const sendButtons: (socket: any, jid: string, payload: any) => Promise<any>;
}
