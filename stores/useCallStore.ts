'use client'

import { create } from 'zustand'

interface IncomingCallData {
  from: string
  callerName: string
  callerPic?: string
  offer: RTCSessionDescriptionInit
}

interface CallStore {
  incomingCall: IncomingCallData | null
  shouldAcceptIncomingCall: boolean
  setIncomingCall: (data: IncomingCallData) => void
  acceptIncomingCall: () => void
  clearIncomingCall: () => void
}

export const useCallStore = create<CallStore>((set) => ({
  incomingCall: null,
  shouldAcceptIncomingCall: false,
  setIncomingCall: (data) => set({ incomingCall: data, shouldAcceptIncomingCall: false }),
  acceptIncomingCall: () => set({ shouldAcceptIncomingCall: true }),
  clearIncomingCall: () => set({ incomingCall: null, shouldAcceptIncomingCall: false }),
}))
