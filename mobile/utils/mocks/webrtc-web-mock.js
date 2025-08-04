// Mock WebRTC for web platform
export const RTCPeerConnection = window.RTCPeerConnection || {};
export const RTCSessionDescription = window.RTCSessionDescription || {};
export const RTCIceCandidate = window.RTCIceCandidate || {};
export const MediaStream = window.MediaStream || {};
export const MediaStreamTrack = window.MediaStreamTrack || {};

export const getUserMedia = () => Promise.resolve(null);
export const registerGlobals = () => {};

export default {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  MediaStreamTrack,
  getUserMedia,
  registerGlobals,
};