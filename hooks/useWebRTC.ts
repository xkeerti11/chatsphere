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

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:relay.metered.ca:80',
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
    },
    {
      urls: 'turns:relay.metered.ca:443',
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
    },
  ],
  iceCandidatePoolSize: 10,
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
  const callStartTimeRef = useRef<number | null>(null)
  const callStateRef = useRef<CallState>('idle')
  const remoteUserIdRef = useRef<string | null>(null)
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    callStateRef.current = callState
  }, [callState])

  useEffect(() => {
    remoteUserIdRef.current = remoteUserId
  }, [remoteUserId])

  // CLEANUP
  const cleanupCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    peerRef.current?.close()
    peerRef.current = null
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
    callStartTimeRef.current = null
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current)
      retryIntervalRef.current = null
    }
    remoteUserIdRef.current = null
    setRemoteUserId(null)
    setCallDuration(0)
    setIsMuted(false)
  }, [])

  // END CALL
  const endCall = useCallback(() => {
    const activeRemoteUserId = remoteUserIdRef.current

    if (socket && activeRemoteUserId) {
      socket.emit('call:end', { to: activeRemoteUserId })
    }
    cleanupCall()
    setCallState('ended')
    setTimeout(() => setCallState('idle'), 2000)
  }, [socket, cleanupCall])

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
        remoteAudioRef.current.volume = 1.0
        remoteAudioRef.current.muted = false
        remoteAudioRef.current.setAttribute('playsinline', 'true')

        const playPromise = remoteAudioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(async () => {
            await new Promise(r => setTimeout(r, 500))
            remoteAudioRef.current?.play().catch(console.error)
          })
        }
      }
    }

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState
      console.log('Peer connection state:', state)

      if (state === 'connected') {
        setCallState('connected')
        if (!callStartTimeRef.current) {
          callStartTimeRef.current = Date.now()
          setCallDuration(0)
        }
      }

      if (state === 'disconnected') {
        setTimeout(() => {
          if (peerRef.current?.connectionState === 'disconnected') {
            peerRef.current.restartIce()
          }
        }, 3000)
      }

      if (state === 'failed') {
        console.log('Connection failed - ending call')
        endCall()
      }
    }

    peer.oniceconnectionstatechange = () => {
      const iceState = peer.iceConnectionState
      console.log('ICE state:', iceState)

      if (iceState === 'connected' || iceState === 'completed') {
        setCallState(prev => 
          prev === 'calling' ? 'connected' : prev
        )
        if (!callStartTimeRef.current) {
          callStartTimeRef.current = Date.now()
          setCallDuration(0)
        }
      }

      if (iceState === 'failed') {
        peerRef.current?.restartIce()
      }
    }

    peer.onnegotiationneeded = async () => {
      console.log('Negotiation needed')
    }

    return peer
  }, [socket, endCall])

  const getLocalStream = async () => {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1,
      },
      video: false,
    }

    try {
      const stream = await navigator.mediaDevices
        .getUserMedia(constraints)
      localStreamRef.current = stream
      return stream
    } catch {
      console.log('Trying basic audio constraints...')
      const stream = await navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
      localStreamRef.current = stream
      return stream
    }
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
      remoteUserIdRef.current = targetUserId
      setRemoteUserId(targetUserId)
      setRemoteName(targetName)
      setRemotePic(targetPic)

      const stream = await getLocalStream()
      const peer = createPeerConnection(targetUserId)
      peerRef.current = peer

      // Add local audio tracks before creating the offer.
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream)
      })

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      })
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
      currentUserPic, createPeerConnection, cleanupCall])

  // REJECT CALL
  const rejectCall = useCallback(() => {
    if (!socket || !incomingCall) return

    socket.emit('call:reject', { to: incomingCall.from })
    setIncomingCall(null)
    setCallState('idle')
  }, [socket, incomingCall])

  // ACCEPT CALL
  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) return

    try {
      const { from, offer } = incomingCall
      remoteUserIdRef.current = from
      setRemoteUserId(from)
      setCallState('calling')

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

    } catch (error) {
      console.error('Accept call error:', error)
      rejectCall()
    }
  }, [socket, incomingCall, createPeerConnection, rejectCall])

  // MUTE/UNMUTE
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(prev => !prev)
    }
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

    try {
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      )
      console.log('Remote description set - waiting for ICE')
    } catch (error) {
      console.error('Set remote description error:', error)
      endCall()
    }
  }, [endCall])

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

  useEffect(() => {
    if (callState !== 'connected') {
      return
    }

    if (!callStartTimeRef.current) {
      callStartTimeRef.current = Date.now()
    }

    setCallDuration(0)

    const timer = setInterval(() => {
      if (callStartTimeRef.current) {
        const elapsed = Math.floor(
          (Date.now() - callStartTimeRef.current) / 1000
        )
        setCallDuration(elapsed)
      }
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [callState])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && callState === 'connected') {
        console.log('App backgrounded during call')
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )
    return () => document.removeEventListener(
      'visibilitychange',
      handleVisibilityChange
    )
  }, [callState])

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
