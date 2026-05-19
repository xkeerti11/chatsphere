'use client'
import { Phone, PhoneOff } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface Props {
  callerName: string
  callerPic?: string
  onAccept: () => void
  onReject: () => void
}

export function IncomingCallPopup({ 
  callerName, 
  callerPic, 
  onAccept, 
  onReject 
}: Props) {
  return (
    <div className="fixed inset-x-4 top-4 z-[9999] 
    md:inset-x-auto md:right-4 md:w-80">
      <div className="bg-gray-900 text-white 
      rounded-2xl shadow-2xl p-4 border 
      border-gray-700">
        
        {/* Animated ring indicator */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar
              name={callerName}
              src={callerPic}
              size="lg"
              className="h-14 w-14"
            />
            {/* Pulse animation */}
            <span className="absolute inset-0 
            rounded-full animate-ping 
            bg-green-400 opacity-30"/>
          </div>
          <div>
            <p className="text-xs text-gray-400 
            mb-0.5">
              Incoming audio call
            </p>
            <p className="font-semibold text-lg 
            leading-tight">
              {callerName}
            </p>
          </div>
        </div>

        {/* Accept / Reject buttons */}
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 flex items-center 
            justify-center gap-2 bg-red-500 
            hover:bg-red-600 text-white rounded-xl 
            py-3 font-medium transition-colors
            active:scale-95"
          >
            <PhoneOff size={18} />
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex items-center 
            justify-center gap-2 bg-green-500 
            hover:bg-green-600 text-white rounded-xl 
            py-3 font-medium transition-colors
            active:scale-95"
          >
            <Phone size={18} />
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
