"use client";

import { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Phone, Video, VideoOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppContext } from '@/context/AppContext';
import { DoctorContext } from '@/context/DoctorContext';
import type { IPatientAppContext } from '@/models/patient';
import type { IDoctorContext } from '@/models/doctor';

interface Participant {
  id: string;
  name: string;
  isLocal?: boolean;
  stream?: MediaStream;
}

interface PeerConnection {
  [userId: string]: RTCPeerConnection;
}

export default function MeetingPage() {
  const params = useParams() as { id: string };
  const searchParams = useSearchParams();
  const meetingId = params.id as string;

  // Get user context for patient, doctor, or admin
  const patientContext = useContext(AppContext) as IPatientAppContext | null;
  const doctorContext = useContext(DoctorContext) as IDoctorContext | null;

  // Determine user name based on context
  const getUserName = () => {
    if (patientContext?.userData?.name) {
      return patientContext.userData.name;
    }
    if (doctorContext?.profileData?.name) {
      return doctorContext.profileData.name;
    }
    return searchParams?.get('name') || 'Guest';
  };

  const userName = getUserName();
  const isMobile = useIsMobile();

  // States
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<PeerConnection>({});
  const remoteVideoRefs = useRef<{ [userId: string]: HTMLVideoElement | null }>({});
  const initializedRef = useRef(false);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize media and socket connection
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeMedia = async () => {
      let stream: MediaStream | null = null;
      try {
        const constraints = {
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Media error:', err);
        setErrorMessage('Failed to access camera/microphone.');
      }
      
      // Always initialize socket
      const socket = io({ path: '/api/socket', transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('join-room', { roomId: meetingId, userName });
      });

      socket.on('existing-users', (users) => {
        users.forEach((user: any) => {
          if (stream) createPeerConnection(user.id, user.name, true, stream);
        });
      });

      socket.on('user-joined', ({ userId, userName: newName }) => {
        setParticipants(prev => [...prev, { id: userId, name: newName }]);
        if (stream) createPeerConnection(userId, newName, false, stream);
      });

      socket.on('webrtc-offer', async ({ offer, offerUserId, roomId }) => {
        let pc = peerConnectionsRef.current[offerUserId];
        if (!pc && stream) {
          await createPeerConnection(offerUserId, 'Participant', false, stream);
          pc = peerConnectionsRef.current[offerUserId];
        }
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', { answer, targetUserId: offerUserId, roomId });
        }
      });

      socket.on('webrtc-answer', async ({ answer, answerUserId }) => {
        const pc = peerConnectionsRef.current[answerUserId];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('webrtc-ice-candidate', async ({ candidate, candidateUserId }) => {
        const pc = peerConnectionsRef.current[candidateUserId];
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
      
      socket.on('user-left', ({ userId }) => {
        setParticipants(prev => prev.filter(p => p.id !== userId));
        if (peerConnectionsRef.current[userId]) {
          peerConnectionsRef.current[userId].close();
          delete peerConnectionsRef.current[userId];
        }
      });
    };

    initializeMedia();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId: meetingId, userName });
        socketRef.current.disconnect();
      }
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [meetingId, userName]);

  // Create peer connection for new user
  const createPeerConnection = async (
    userId: string,
    participantName: string,
    isInitiator: boolean,
    stream: MediaStream
  ) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionsRef.current[userId] = pc;

    // Add local stream tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote stream from:', participantName);
      const [remoteStream] = event.streams;

      setParticipants((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, stream: remoteStream } : p))
      );

      // Set remote stream to video element
      setTimeout(() => {
        const videoElement = remoteVideoRefs.current[userId];
        if (videoElement && remoteStream) {
          videoElement.srcObject = remoteStream;
          videoElement.play().catch(console.error);
        }
      }, 100);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          targetUserId: userId,
          roomId: meetingId
        });
      }
    };

    // If we're the initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (socketRef.current) {
          socketRef.current.emit('webrtc-offer', {
            offer,
            targetUserId: userId,
            roomId: meetingId
          });
        }
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  // End call
  const endCall = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId: meetingId, userName });
    }
    window.location.href = '/';
  };

  // Copy meeting link
  const copyMeetingLink = () => {
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    alert('Meeting link copied to clipboard');
  };

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-white block leading-tight">Meeting Session</span>
            <span className="text-xs text-gray-400">
              ID: {meetingId} • {isConnected ? <span className="text-green-500">Live</span> : <span className="text-yellow-500">Connecting...</span>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={copyMeetingLink}
            className="hidden sm:flex bg-slate-900 border-slate-700 text-gray-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer rounded-full px-5"
          >
            Invite Member
          </Button>
          <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden sm:block"></div>
          <div className="flex -space-x-2">
            {participants.slice(0, 3).map((p, i) => (
              <div key={p.id} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] text-white overflow-hidden">
                {p.name.charAt(0)}
              </div>
            ))}
            {participants.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-primary flex items-center justify-center text-[10px] text-white">
                +{participants.length - 3}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {errorMessage && (
          <div className="bg-red-500 p-2 text-center text-white">
            {errorMessage}
            <Button
              variant="link"
              className="ml-2 text-white underline cursor-pointer"
              onClick={() => setErrorMessage(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 meeting-scroll">
          <div
            className="grid gap-4 justify-items-center items-start content-start min-h-full"
            style={{
              gridTemplateColumns:
                participants.length <= 2
                  ? isMobile
                    ? '1fr'
                    : 'repeat(auto-fit, minmax(500px, 1fr))'
                  : isMobile
                    ? '1fr'
                    : participants.length <= 4
                      ? 'repeat(2, 1fr)'
                      : 'repeat(auto-fit, minmax(300px, 1fr))'
            }}
          >
            {participants.map((participant) => (
              <Card
                key={participant.id}
                className={`relative overflow-hidden w-full ${
                  participants.length <= 2
                    ? 'aspect-video max-h-[60vh] min-h-[300px]'
                    : isMobile
                      ? 'aspect-video max-h-[30vh] min-h-[200px]'
                      : 'aspect-video max-h-[40vh] min-h-[250px]'
                } bg-slate-800`}
              >
                {participant.isLocal ? (
                  isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-slate-700">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-3xl">
                          {participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )
                ) : participant.stream ? (
                  <video
                    ref={(el) => {
                      remoteVideoRefs.current[participant.id] = el;
                    }}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-slate-700">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-3xl">
                        {participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm text-white">
                  {participant.name} {participant.isLocal && '(You)'}
                  {participant.isLocal && !isMicOn && <MicOff className="ml-1 inline h-3 w-3" />}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex justify-center items-center gap-4 bg-slate-950/60 backdrop-blur-xl p-4 px-8 rounded-full border border-white/10 shadow-2xl z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-full border-none transition-all duration-300 ${!isMicOn ? 'bg-red-500/80 text-white hover:bg-red-600' : 'bg-slate-800/80 text-white hover:bg-slate-700'} cursor-pointer`}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-slate-800 text-white">
                {isMicOn ? 'Mute' : 'Unmute'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full border-none transition-all duration-300 ${!isVideoOn ? 'bg-red-500/80 text-white hover:bg-red-600' : 'bg-slate-800/80 text-white hover:bg-slate-700'} cursor-pointer`}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-slate-800 text-white">
                {isVideoOn ? 'Stop Video' : 'Start Video'}
              </TooltipContent>
            </Tooltip>

            <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={endCall}
                  className="w-14 h-14 rounded-full border-none bg-red-600 text-white hover:bg-red-700 hover:scale-110 transition-all duration-300 shadow-lg shadow-red-900/20 cursor-pointer"
                >
                  <Phone className="h-6 w-6 rotate-[135deg]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-red-900 border-red-800 text-white">
                Leave Call
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </main>
    </div>
  );
}
