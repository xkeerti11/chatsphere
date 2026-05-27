'use client'

import { create } from 'zustand'

interface IncomingCallData {
  from: string
  callerName: string
  callerPic?: string
  offer: RTCSessionDescriptionInit
}

interface CallStore {
  incomingCallData: IncomingCallData | null
  setIncomingCallData: (data: IncomingCallData) => void
  clearIncomingCallData: () => void
}

export const useCallStore = create<CallStore>((set) => ({
  incomingCallData: null,
  setIncomingCallData: (data) => set({ incomingCallData: data }),
  clearIncomingCallData: () => set({ incomingCallData: null }),
}))
