import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceAgent } from '../core/VoiceAgent';
import { SessionStatus } from '../types';
import type { VoiceAgentConfig, VoiceAgentCallbacks, Message } from '../types';

export interface UseVoiceAgentOptions extends VoiceAgentConfig {
  callbacks?: VoiceAgentCallbacks;
}

export interface UseVoiceAgentReturn {
  status: SessionStatus;
  messages: Message[];
  isAssistantTalking: boolean;
  start: () => Promise<void>;
  stop: () => void;
  updateSystemInstruction: (instruction: string) => void;
}

export function useVoiceAgent(options: UseVoiceAgentOptions): UseVoiceAgentReturn {
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAssistantTalking, setIsAssistantTalking] = useState(false);
  const agentRef = useRef<VoiceAgent | null>(null);

  const handleStatusChange = useCallback((newStatus: SessionStatus) => {
    setStatus(newStatus);
  }, []);

  const handleMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleAudioStart = useCallback(() => {
    setIsAssistantTalking(true);
  }, []);

  const handleAudioEnd = useCallback(() => {
    setIsAssistantTalking(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('VoiceAgent error:', error);
  }, []);

  useEffect(() => {
    const callbacks: VoiceAgentCallbacks = {
      onStatusChange: handleStatusChange,
      onMessage: handleMessage,
      onAudioStart: handleAudioStart,
      onAudioEnd: handleAudioEnd,
      onError: handleError,
      ...options.callbacks,
    };

    agentRef.current = new VoiceAgent(options, callbacks);

    return () => {
      if (agentRef.current) {
        agentRef.current.stop();
      }
    };
  }, [options.apiKey, options.model, options.voiceName]);

  const start = useCallback(async () => {
    if (agentRef.current) {
      await agentRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (agentRef.current) {
      agentRef.current.stop();
    }
    setMessages([]);
  }, []);

  const updateSystemInstruction = useCallback((instruction: string) => {
    if (agentRef.current) {
      agentRef.current.updateConfig({ systemInstruction: instruction });
    }
  }, []);

  return {
    status,
    messages,
    isAssistantTalking,
    start,
    stop,
    updateSystemInstruction,
  };
}
