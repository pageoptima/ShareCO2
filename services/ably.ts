import * as Ably from 'ably';

// Initialize Ably Realtime client with your API key
const ably = new Ably.Rest( process.env.ABLY_SERVER_API_KEY as string );

export default ably;