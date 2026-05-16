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
  const params = useParams();
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
    return searchParams.get('name') || 'Guest';
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

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize media and socket connection
  useEffect(() => {
    const initializeMedia = async () => {
      let stream: MediaStream | null = null;

      try {
        // Try to get audio first, then video
        const audioConstraints: MediaStreamConstraints = { audio: true, video: false };

        try {
          stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
          console.log('Audio access granted');

          // If audio works, try to add video
          if (isVideoOn) {
            try {
              const videoConstraints: MediaStreamConstraints = {
                audio: true,
                video: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 30 }
                }
              };

              // Stop audio-only stream and get audio+video
              stream.getTracks().forEach((track) => track.stop());
              stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
              console.log('Video access granted');
            } catch (videoErr) {
              console.warn('Video access failed, continuing with audio only:', videoErr);
              // Keep audio-only stream
              stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
              setIsVideoOn(false);
            }
          }
        } catch (audioErr) {
          console.warn('Audio access failed:', audioErr);
          // Continue without any media, but still allow joining the meeting
          stream = null;
        }

        setLocalStream(stream);

        if (localVideoRef.current && stream && isVideoOn) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(console.error);
        }

        // Initialize Socket.IO connection
        // Connect to the integrated socket endpoint
        const socket = io({
          path: '/api/socket'
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Connected to server');
          setIsConnected(true);

          // Join the meeting room
          socket.emit('join-room', { roomId: meetingId, userName });

          // Add local participant (even without stream)
          setParticipants([
            { id: 'local', name: userName, isLocal: true, stream: stream || undefined }
          ]);
        });

        socket.on('existing-users', (users: { id: string; name: string }[]) => {
          console.log('Existing users:', users);
          users.forEach((user) => {
            if (stream) {
              createPeerConnection(user.id, user.name, true, stream);
            }
          });
        });

        socket.on(
          'user-joined',
          ({ userId, userName: newUserName }: { userId: string; userName: string }) => {
            console.log(`User joined: ${newUserName}`);
            setParticipants((prev) => [...prev, { id: userId, name: newUserName }]);
            if (stream) {
              createPeerConnection(userId, newUserName, false, stream);
            }
          }
        );

        socket.on(
          'user-left',
          ({ userId, userName: leftUserName }: { userId: string; userName: string }) => {
            console.log(`User left: ${leftUserName}`);
            setParticipants((prev) => prev.filter((p) => p.id !== userId));

            // Clean up peer connection
            if (peerConnectionsRef.current[userId]) {
              peerConnectionsRef.current[userId].close();
              delete peerConnectionsRef.current[userId];
            }

            // Clean up video ref
            if (remoteVideoRefs.current[userId]) {
              delete remoteVideoRefs.current[userId];
            }
          }
        );

        // WebRTC signaling events
        socket.on(
          'webrtc-offer',
          async ({
            offer,
            offerUserId
          }: {
            offer: RTCSessionDescriptionInit;
            offerUserId: string;
          }) => {
            const pc = peerConnectionsRef.current[offerUserId];
            if (pc) {
              await pc.setRemoteDescription(offer);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit('webrtc-answer', {
                answer,
                targetUserId: offerUserId,
                roomId: meetingId
              });
            }
          }
        );

        socket.on(
          'webrtc-answer',
          async ({
            answer,
            answerUserId
          }: {
            answer: RTCSessionDescriptionInit;
            answerUserId: string;
          }) => {
            const pc = peerConnectionsRef.current[answerUserId];
            if (pc) {
              await pc.setRemoteDescription(answer);
            }
          }
        );

        socket.on(
          'webrtc-ice-candidate',
          async ({
            candidate,
            candidateUserId
          }: {
            candidate: RTCIceCandidateInit;
            candidateUserId: string;
          }) => {
            const pc = peerConnectionsRef.current[candidateUserId];
            if (pc) {
              await pc.addIceCandidate(candidate);
            }
          }
        );

        setErrorMessage(null);
      } catch (err) {
        console.error('Error during initialization:', err);
        const error = err as DOMException;

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setErrorMessage(
            'Camera/microphone access denied. Please allow access and refresh the page.'
          );
        } else if (error.name === 'NotFoundError') {
          setErrorMessage('No camera or microphone found. Please check your devices.');
        } else if (error.name === 'NotReadableError') {
          setErrorMessage(
            'Camera/microphone is already in use by another application. Please close other video apps and refresh.'
          );
        } else {
          setErrorMessage(
            'Could not access your camera or microphone. Joining meeting without media...'
          );
        }

        // Even if media fails, still try to connect to the meeting
        try {
          const socket = io({
            path: '/api/socket'
          });
          socketRef.current = socket;

          socket.on('connect', () => {
            console.log('Connected to server (no media)');
            setIsConnected(true);
            socket.emit('join-room', { roomId: meetingId, userName });
            setParticipants([{ id: 'local', name: userName, isLocal: true }]);
          });

          // Add the socket event handlers here too (for the no-media case)
          socket.on('existing-users', (users: { id: string; name: string }[]) => {
            console.log('Existing users:', users);
            setParticipants((prev) => [
              ...prev,
              ...users.map((user) => ({ id: user.id, name: user.name }))
            ]);
          });

          socket.on(
            'user-joined',
            ({ userId, userName: newUserName }: { userId: string; userName: string }) => {
              console.log(`User joined: ${newUserName}`);
              setParticipants((prev) => [...prev, { id: userId, name: newUserName }]);
            }
          );

          socket.on('user-left', ({ userId }: { userId: string }) => {
            setParticipants((prev) => prev.filter((p) => p.id !== userId));
          });
        } catch (socketErr) {
          console.error('Failed to connect to meeting server:', socketErr);
          setErrorMessage(
            'Failed to connect to meeting server. Please check your internet connection.'
          );
        }
      }
    };

    initializeMedia();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId: meetingId, userName });
        socketRef.current.disconnect();
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    };
  }, [meetingId, userName, isVideoOn]);

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
    } else {
      // Try to get microphone access if we don't have it
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
          setLocalStream(stream);
          setIsMicOn(true);
        })
        .catch((err) => {
          console.error('Could not access microphone:', err);
          setErrorMessage('Could not access microphone. Please check permissions.');
        });
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);

        if (localVideoRef.current) {
          if (!isVideoOn) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(console.error);
          }
        }
      } else if (!isVideoOn) {
        // Try to add video if we only have audio
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          localStream.getTracks().forEach((track) => track.stop());
          setLocalStream(newStream);
          setIsVideoOn(true);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
            localVideoRef.current.play().catch(console.error);
          }
        } catch (err) {
          console.error('Could not access camera:', err);
          setErrorMessage('Could not access camera. Please check permissions.');
        }
      }
    } else {
      // Try to get camera access if we don't have any stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setLocalStream(stream);
        setIsVideoOn(true);
        setIsMicOn(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(console.error);
        }
      } catch (err) {
        console.error('Could not access camera:', err);
        setErrorMessage('Could not access camera/microphone. Please check permissions.');
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
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-white" />
          <span className="font-medium text-white">Meeting: {meetingId}</span>
          <span className="text-sm text-gray-400">
            ({isConnected ? 'Connected' : 'Connecting...'})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyMeetingLink}
          className="bg-white border-gray-500 text-black hover:bg-gray-700 hover:border-gray-900 hover:text-white cursor-pointer"
        >
          Copy Invite Link
        </Button>
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

        <div className="flex justify-center gap-2 bg-slate-950 p-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={toggleMic}
                  className={`rounded-full border-none ${!isMicOn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-black hover:bg-gray-200'} cursor-pointer`}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={toggleVideo}
                  className={`rounded-full border-none ${!isVideoOn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-black hover:bg-gray-200'} cursor-pointer`}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isVideoOn ? 'Turn off camera' : 'Turn on camera'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={endCall}
                  className="rounded-full border-none bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                >
                  <Phone className="h-5 w-5 rotate-[135deg]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </main>
    </div>
  );
}
