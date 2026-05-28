'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Socket } from 'socket.io-client'

export type CallState = 
  | 'idle' 
  | 'calling' 
  | 'incoming' 
  | 'connected' 
  | 'ended'

interface UseWebRTCProps {
  socket: Socket | null
  currentUserId: string
  currentUserName: string
  currentUserPic?: string
}

interface IncomingCallData {
  from: string
  callerName: string
  callerPic?: string
  offer: RTCSessionDescriptionInit
}

const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME
const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Google free STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...(TURN_USERNAME && TURN_CREDENTIAL
      ? [
          // Metered TURN server (works across different networks)
          {
            urls: 'turn:relay.metered.ca:80',
            username: TURN_USERNAME,
            credential: TURN_CREDENTIAL,
          },
          {
            urls: 'turn:relay.metered.ca:443',
            username: TURN_USERNAME,
            credential: TURN_CREDENTIAL,
          },
        ]
      : []),
  ]
}

export function useWebRTC({
  socket,
  currentUserId,
  currentUserName,
  currentUserPic,
}: UseWebRTCProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null)
  const [remoteName, setRemoteName] = useState<string>('')
  const [remotePic, setRemotePic] = useState<string | undefined>()
  const [incomingCall, setIncomingCall] = 
    useState<IncomingCallData | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const callStateRef = useRef<CallState>('idle')
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    callStateRef.current = callState
  }, [callState])

  const createPeerConnection = useCallback((targetUserId: string) => {
    const peer = new RTCPeerConnection(ICE_SERVERS)

    // Send ICE candidates to other peer
    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          to: targetUserId,
          candidate: event.candidate
        })
      }
    }

    // Receive remote audio
    peer.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0]
        remoteAudioRef.current.play().catch(console.error)
      }
    }

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setCallState('connected')
        // Start duration timer
        setCallDuration(0)
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1)
        }, 1000)
      }
      if (
        peer.connectionState === 'disconnected' ||
        peer.connectionState === 'failed'
      ) {
        endCall()
      }
    }

    return peer
  }, [socket])

  const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
      video: false
    })
    localStreamRef.current = stream
    return stream
  }

  // INITIATE CALL
  const startCall = useCallback(async (
    targetUserId: string,
    targetName: string,
    targetPic?: string
  ) => {
    console.log('Starting call to:', targetUserId)
    console.log('Socket connected?', socket?.connected)
    console.log('Socket id:', socket?.id)

    if (!socket?.connected) {
      console.error('Socket not connected!')
      alert('Connection issue. Please refresh and try again.')
      return
    }

    if (!socket || callState !== 'idle') return

    try {
      setCallState('calling')
      setRemoteUserId(targetUserId)
      setRemoteName(targetName)
      setRemotePic(targetPic)

      const stream = await getLocalStream()
      const peer = createPeerConnection(targetUserId)
      peerRef.current = peer

      // Add local audio tracks
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream)
      })

      // Create offer
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)

      socket.emit('call:initiate', {
        to: targetUserId,
        from: currentUserId,
        offer,
        callerName: currentUserName,
        callerPic: currentUserPic,
      })

      let retryCount = 0
      const maxRetries = 3

      const retryInterval = setInterval(() => {
        if (retryCount >= maxRetries) {
          clearInterval(retryInterval)
          return
        }

        if (callStateRef.current === 'calling') {
          console.log('Retrying call:initiate, attempt:', retryCount + 1)
          socket.emit('call:initiate', {
            to: targetUserId,
            from: currentUserId,
            offer,
            callerName: currentUserName,
            callerPic: currentUserPic,
          })
          retryCount++
        } else {
          clearInterval(retryInterval)
        }
      }, 3000)

      retryIntervalRef.current = retryInterval

      console.log('call:initiate emitted to:', targetUserId)

    } catch (error) {
      console.error('Start call error:', error)
      setCallState('idle')
      cleanupCall()
    }
  }, [socket, callState, currentUserId, currentUserName, 
      currentUserPic, createPeerConnection])

  // ACCEPT CALL
  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) return

    try {
      const { from, offer } = incomingCall
      setRemoteUserId(from)
      setCallState('connected')

      const stream = await getLocalStream()
      const peer = createPeerConnection(from)
      peerRef.current = peer

      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream)
      })

      await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
      )

      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)

      socket.emit('call:accept', {
        to: from,
        answer,
      })

      setIncomingCall(null)

      // Start duration timer
      setCallDuration(0)
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Accept call error:', error)
      rejectCall()
    }
  }, [socket, incomingCall, createPeerConnection])

  // REJECT CALL
  const rejectCall = useCallback(() => {
    if (!socket || !incomingCall) return

    socket.emit('call:reject', { to: incomingCall.from })
    setIncomingCall(null)
    setCallState('idle')
  }, [socket, incomingCall])

  // END CALL
  const endCall = useCallback(() => {
    if (socket && remoteUserId) {
      socket.emit('call:end', { to: remoteUserId })
    }
    cleanupCall()
    setCallState('ended')
    setTimeout(() => setCallState('idle'), 2000)
  }, [socket, remoteUserId])

  // MUTE/UNMUTE
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(prev => !prev)
    }
  }, [])

  // CLEANUP
  const cleanupCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    peerRef.current?.close()
    peerRef.current = null
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current)
      retryIntervalRef.current = null
    }
    setRemoteUserId(null)
    setCallDuration(0)
    setIsMuted(false)
  }, [])

  // SOCKET EVENT HANDLERS
  const handleIncomingCall = useCallback((data: IncomingCallData) => {
    console.log('INCOMING CALL RECEIVED:', data)

    if (callState !== 'idle') {
      // Already in call - reject automatically
      socket?.emit('call:reject', { to: data.from })
      return
    }
    setIncomingCall(data)
    setRemoteName(data.callerName)
    setRemotePic(data.callerPic)
    setCallState('incoming')
  }, [callState, socket])

  const handleCallAccepted = useCallback(async (
    { answer }: { answer: RTCSessionDescriptionInit }
  ) => {
    if (!peerRef.current) return
    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(answer)
    )
  }, [])

  const handleCallRejected = useCallback(() => {
    cleanupCall()
    setCallState('ended')
    setTimeout(() => setCallState('idle'), 2000)
  }, [cleanupCall])

  const handleCallEnded = useCallback(() => {
    cleanupCall()
    setCallState('ended')
    setTimeout(() => setCallState('idle'), 2000)
  }, [cleanupCall])

  const handleIceCandidate = useCallback(async (
    { candidate }: { candidate: RTCIceCandidateInit }
  ) => {
    if (!peerRef.current) return
    try {
      await peerRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      )
    } catch (error) {
      console.error('ICE candidate error:', error)
    }
  }, [])

  const handleUnavailable = useCallback(() => {
    cleanupCall()
    setCallState('idle')
    alert('User is not available for call')
  }, [cleanupCall])

  return {
    // State
    callState,
    remoteUserId,
    remoteName,
    remotePic,
    incomingCall,
    isMuted,
    callDuration,
    remoteAudioRef,

    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,

    // Socket handlers (attach these in component)
    handleIncomingCall,
    handleCallAccepted,
    handleCallRejected,
    handleCallEnded,
    handleIceCandidate,
    handleUnavailable,
  }
}
