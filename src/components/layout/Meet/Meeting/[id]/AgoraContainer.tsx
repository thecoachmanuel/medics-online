'use client';

import React, { useEffect, useRef, useState, useContext } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack, 
  IAgoraRTCRemoteUser 
} from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';
import { 
  Mic, MicOff, Video, VideoOff, Phone, 
  Send, MessageSquare, X, FileText, CheckCircle2 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AppContext } from '@/context/AppContext';
import { DoctorContext } from '@/context/DoctorContext';
import { smartApi } from '@/utils/smartApi';

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
  isLocal: boolean;
  timestamp?: number;
}

interface AgoraContainerProps {
  meetingId: string;
  userName: string;
  isDoctor: boolean;
  token?: string; // App token for API calls
}

const AgoraContainer: React.FC<AgoraContainerProps> = ({ 
  meetingId, 
  userName, 
  isDoctor,
  token 
}) => {
  const router = useRouter();
  
  // Agora State
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  
  // UI State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rtmClient, setRtmClient] = useState<any>(null);
  
  // Consultation Form State (for Doctor)
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [partnerName, setPartnerName] = useState('Participant');
  const [isPipMode, setIsPipMode] = useState(true);

  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Agora
  useEffect(() => {
    let agoraClient: IAgoraRTCClient;
    let audioTrack: IMicrophoneAudioTrack;
    let videoTrack: ICameraVideoTrack;
    let rtmInstance: any;

    const init = async () => {
      try {
        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setClient(agoraClient);

        // Fetch token from our API
        const uid = Math.floor(Math.random() * 1000000);
        const response = await fetch('/api/agora/token', {
          method: 'POST',
          body: JSON.stringify({ 
            channelName: meetingId, 
            uid, 
            role: isDoctor ? 'publisher' : 'publisher' 
          }),
        });
        const tokenData = await response.json();

        if (!tokenData.success) throw new Error('Failed to get Agora token');

        if (tokenData.appointment) {
          const otherName = isDoctor 
            ? tokenData.appointment.patientName 
            : tokenData.appointment.doctorName;
          setPartnerName(otherName || 'Participant');
          
          // Load Chat History
          if (tokenData.appointment.chatHistory) {
            const history = tokenData.appointment.chatHistory.map((m: any) => ({
              sender: m.sender,
              text: m.message,
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isLocal: m.sender === userName,
              timestamp: m.timestamp
            }));
            setMessages(history);
          }
        }

        // Initialize RTM
        try {
          const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
          rtmInstance = new AgoraRTM.RTM(appId, uid.toString());
          setRtmClient(rtmInstance);
          
          await rtmInstance.login();
          await rtmInstance.subscribe(meetingId);
          
          rtmInstance.addEventListener('message', (event: any) => {
            const { message, publisher } = event;
            if (publisher !== uid.toString()) {
              const msgData = JSON.parse(message);
              const newMsg = {
                sender: msgData.sender,
                text: msgData.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isLocal: false,
                timestamp: Date.now()
              };
              setMessages(prev => [...prev, newMsg]);
              
              // Notification for unread message
              setMessages(currentMessages => {
                // This is a trick to access showChat in the listener
                return currentMessages;
              });
              
              // We'll handle unreadCount using a ref or by checking state in a separate effect if needed
              // but for now, simple increment:
              setUnreadCount(prev => prev + 1);
              toast.info(`New message from ${msgData.sender}`, { position: 'top-right', autoClose: 2000 });
            }
          });
        } catch (rtmErr) {
          console.error('RTM Init Error:', rtmErr);
        }

        // Event Listeners
        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          if (mediaType === 'video') {
            setRemoteUsers(prev => {
              if (prev.find(u => u.uid === user.uid)) return prev;
              return [...prev, user];
            });
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        agoraClient.on('user-unpublished', (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        agoraClient.on('user-left', (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        // Join channel
        await agoraClient.join(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!, 
          meetingId, 
          tokenData.token, 
          uid
        );

        // Create and publish local tracks
        [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        await agoraClient.publish([audioTrack, videoTrack]);
        console.log('✅ Agora joined and published');

      } catch (err) {
        console.error('Agora Init Error:', err);
        toast.error('Failed to join video room');
      }
    };

    init();

    return () => {
      const cleanup = async () => {
        audioTrack?.close();
        videoTrack?.close();
        if (agoraClient) {
          await agoraClient.leave();
        }
        if (rtmInstance) {
          await rtmInstance.logout();
        }
      };
      cleanup();
    };
  }, [meetingId]);

  // Handle Chat
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      sender: userName,
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLocal: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    const textToSend = inputText;
    setInputText('');

    try {
      // 1. Send via RTM for real-time
      if (rtmClient) {
        await rtmClient.publish(meetingId, JSON.stringify({
          sender: userName,
          text: textToSend
        }));
      }

      // 2. Persist to DB
      await fetch('/api/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          meetingId,
          sender: userName,
          text: textToSend
        })
      });
    } catch (err) {
      console.error('Send Error:', err);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Toggle Controls
  const toggleMic = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleEndCall = () => {
    if (isDoctor) {
      setShowSummaryModal(true);
    } else {
      router.push('/my-appointments');
    }
  };

  const submitConsultation = async () => {
    if (!notes || !prescription) {
      return toast.warning('Please fill in both notes and prescription');
    }

    setIsSaving(true);
    try {
      const data = (await smartApi.post(
        '/api/doctor/save-consultation',
        { appointmentId: meetingId, notes, prescription },
        { headers: { dtoken: token } }
      )) as { success: boolean; message?: string };

      if (data.success) {
        toast.success('Consultation records saved');
        router.push('/doctor-dashboard');
      } else {
        toast.error(data.message || 'Failed to save records');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save records');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Video Grid Section */}
      <div className={`relative flex-1 flex flex-col transition-all duration-500 ${showChat ? 'mr-80' : ''}`}>
        
        {/* Header / Info */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium opacity-90">{meetingId}</span>
        </div>

        {/* Video Display Area */}
        <div className="flex-1 relative overflow-hidden group">
          {remoteUsers.length === 0 ? (
            // Full screen local video when alone (Waiting state)
            <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
              <div ref={localVideoRef} className="w-full h-full object-cover scale-x-[-1] absolute inset-0" />
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                  <Avatar className="w-32 h-32 border-4 border-primary/20">
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary uppercase">
                      {userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="z-20 text-center space-y-4">
                <div className="bg-black/40 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 inline-block shadow-2xl">
                  <p className="text-lg font-medium">Waiting for {isDoctor ? 'patient' : 'doctor'} to join...</p>
                </div>
              </div>
              <div className="absolute bottom-10 left-10 z-20 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                <span className="text-sm font-medium">{userName} (You)</span>
                {!isMicOn && <MicOff className="w-3 h-3 text-red-500" />}
              </div>
            </div>
          ) : (
            // SPEAKER MODE (Remote is Full, Local is PiP)
            <div className="w-full h-full relative bg-slate-950">
              {/* Remote Video (Full Screen) */}
              {remoteUsers.map(user => (
                <div key={user.uid} className="w-full h-full absolute inset-0 bg-slate-900">
                  <div 
                    ref={el => { if (el) user.videoTrack?.play(el) }} 
                    className="w-full h-full object-cover" 
                  />
                  {!user.hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                      <Avatar className="w-40 h-40 border-4 border-white/5">
                        <AvatarFallback className="text-5xl bg-slate-800 text-slate-300">
                          {partnerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  {/* Remote Name Label */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 duration-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold tracking-wide uppercase text-white/90">
                      Consulting with {isDoctor ? 'Patient' : 'Dr.'} {partnerName}
                    </span>
                  </div>
                </div>
              ))}

              {/* Local Video (PiP) */}
              <div className={`absolute transition-all duration-500 shadow-2xl overflow-hidden border-2 border-white/10 z-30 ${isPipMode ? 'bottom-28 right-8 w-64 aspect-video rounded-2xl cursor-pointer hover:scale-105' : 'inset-0 w-full h-full rounded-none'}`}
                   onClick={() => setIsPipMode(!isPipMode)}>
                <div ref={localVideoRef} className="w-full h-full object-cover scale-x-[-1]" />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <Avatar className={isPipMode ? "w-16 h-16" : "w-32 h-32"}>
                      <AvatarFallback className="text-xl">{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-medium flex items-center gap-1">
                  <span>{userName} (You)</span>
                  {!isMicOn && <MicOff className="w-2.5 h-2.5 text-red-500" />}
                </div>
                {isPipMode && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1 rounded-md">
                    <X size={12} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/60 backdrop-blur-2xl p-4 px-8 rounded-full border border-white/10 shadow-2xl z-20 scale-110">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-full border-none transition-all ${!isMicOn ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMicOn ? 'Mute' : 'Unmute'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full border-none transition-all ${!isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isVideoOn ? 'Stop Video' : 'Start Video'}</TooltipContent>
            </Tooltip>

            <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => {
                    setShowChat(!showChat);
                    if (!showChat) setUnreadCount(0);
                  }}
                  className={`w-12 h-12 rounded-full border-none transition-all relative ${showChat ? 'bg-primary text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  <MessageSquare size={20} />
                  {unreadCount > 0 && !showChat && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce shadow-lg border-2 border-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleEndCall}
                  className="w-14 h-14 rounded-full border-none bg-red-600 hover:bg-red-700 hover:scale-110 transition-all shadow-lg shadow-red-500/20"
                >
                  <Phone size={24} className="rotate-[135deg]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Side Chat Section */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-slate-900/40 backdrop-blur-3xl border-l border-white/5 flex flex-col transform transition-transform duration-500 ease-out z-30 ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            Live Chat
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="rounded-full hover:bg-white/5">
            <X size={18} />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.isLocal ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-800 text-white rounded-tl-none border border-white/5'}`}>
                {msg.text}
              </div>
              <span className="text-[10px] opacity-40 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-slate-900/50 border-t border-white/5">
          <div className="relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <Button 
              size="icon" 
              onClick={sendMessage}
              className="absolute right-1 top-1 w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 transition-all"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary / Prescription Modal for Doctor */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-xl bg-slate-900 border-white/10 rounded-3xl overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Consultation Summary</h2>
                  <p className="text-slate-400 text-sm italic">Wrap up this session with notes and prescriptions</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Clinical Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Document symptoms, observations, and discussion..."
                    className="w-full min-h-[120px] bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Prescription & Advice</label>
                  <textarea 
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="Medications, dosages, and follow-up instructions..."
                    className="w-full min-h-[120px] bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSummaryModal(false)}
                  className="flex-1 rounded-2xl h-12 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  Back to Call
                </Button>
                <Button 
                  disabled={isSaving}
                  onClick={submitConsultation}
                  className="flex-1 rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 group"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Complete Session
                      <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AgoraContainer;
