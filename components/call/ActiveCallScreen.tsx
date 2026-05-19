'use client'
import { Mic, MicOff, PhoneOff } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { CallState } from '@/hooks/useWebRTC'

interface Props {
  callState: CallState
  remoteName: string
  remotePic?: string
  isMuted: boolean
  callDuration: number
  onMute: () => void
  onEnd: () => void
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function ActiveCallScreen({
  callState,
  remoteName,
  remotePic,
  isMuted,
  callDuration,
  onMute,
  onEnd,
  remoteAudioRef,
}: Props) {
  const statusText = {
    calling: 'Calling...',
    incoming: 'Connecting...',
    connected: formatDuration(callDuration),
    ended: 'Call ended',
    idle: '',
  }[callState]

  return (
    <div className="fixed inset-0 z-[9998] 
    flex flex-col items-center justify-center
    bg-gradient-to-b from-gray-900 to-gray-800">
      
      {/* Hidden audio element */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline
        className="hidden"
      />

      {/* Remote user info */}
      <div className="flex flex-col items-center 
      gap-4 mb-12">
        <div className="relative">
          <Avatar
            name={remoteName}
            src={remotePic}
            size="xl"
            className="h-28 w-28 text-3xl"
          />
          {callState === 'connected' && (
            <span className="absolute bottom-1 
            right-1 h-4 w-4 rounded-full 
            bg-green-500 border-2 border-white"/>
          )}
        </div>
        <div className="text-center">
          <p className="text-white text-2xl 
          font-bold mb-2">
            {remoteName}
          </p>
          <p className={`text-sm font-medium
            ${callState === 'connected' 
              ? 'text-green-400' 
              : 'text-gray-400'
            }`}>
            {statusText}
          </p>
        </div>
      </div>

      {/* Call controls */}
      <div className="flex items-center gap-6">
        
        {/* Mute button */}
        <button
          onClick={onMute}
          className={`flex flex-col items-center 
          gap-2 w-16 h-16 rounded-full 
          flex items-center justify-center
          transition-all active:scale-95
          ${isMuted 
            ? 'bg-white text-gray-900' 
            : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          {isMuted 
            ? <MicOff size={24}/> 
            : <Mic size={24}/>
          }
        </button>

        {/* End call button */}
        <button
          onClick={onEnd}
          className="flex items-center justify-center
          w-20 h-20 rounded-full bg-red-500 
          hover:bg-red-600 text-white shadow-lg
          transition-all active:scale-95"
        >
          <PhoneOff size={28}/>
        </button>

      </div>

      {/* Mute label */}
      {isMuted && (
        <p className="mt-6 text-yellow-400 
        text-sm font-medium">
          🔇 Microphone muted
        </p>
      )}
    </div>
  )
}
