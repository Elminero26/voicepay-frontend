import React, { useState, useEffect, useMemo } from 'react';
import { Bot, Mic } from 'lucide-react';
import { useCallStore } from '../../../stores/useCallStore';

interface FloatingSpeechBubblesProps {
  nodeId: string;
  nodeLabel: string;
  voicePrompt: string;
}

// Dialog map for standard nodes in Spanish
const dialogMap: { [key: string]: { bot: string; user: string } } = {
  '1': {
    bot: "Bienvenido al sistema de pagos automáticos VoicePay. Por favor, espere mientras le identificamos.",
    user: "Hola, buenas. Quería pagar una factura pendiente."
  },
  '2': {
    bot: "Para garantizar su seguridad, estamos verificando el número de teléfono desde el que nos llama.",
    user: "De acuerdo. Estoy llamando desde mi móvil de empresa."
  },
  '3': {
    bot: "Hemos detectado una factura pendiente de ciento cincuenta euros. Pulse uno para proceder con el pago seguro con tarjeta, o pulse dos si prefiere ser atendido por un agente.",
    user: "Quiero hacer el pago de la factura de ciento cincuenta euros con mi tarjeta bancaria."
  },
  '4': {
    bot: "Esperando su selección. Marque uno para pagar, o dos para soporte.",
    user: "Pulso la tecla uno para pagar."
  },
  '5': {
    bot: "Su pago de ciento cincuenta euros ha sido procesado y aprobado correctamente. Muchas gracias por utilizar VoicePay. Hasta pronto.",
    user: "Perfecto, pago confirmado. Muchas gracias por la rapidez. Adiós."
  },
  '6': {
    bot: "Estamos transfiriendo su llamada con el siguiente agente disponible. Por favor, no cuelgue.",
    user: "Vale, aguardo en línea a que me atienda el agente disponible."
  }
};

// Sub-component for word-by-word typewriter text
const WordTypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({
  text,
  speed = 100,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) return;
    const words = text.split(' ');
    setDisplayedText('');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < words.length) {
        setDisplayedText((prev) => (prev ? prev + ' ' : '') + words[index]);
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export const FloatingSpeechBubbles: React.FC<FloatingSpeechBubblesProps> = ({
  nodeId,
  nodeLabel,
  voicePrompt,
}) => {
  const simPath = useCallStore((state) => state.simPath);
  const isSimulating = useCallStore((state) => state.isSimulating);
  const simulatedCall = useCallStore((state) => state.simulatedCall);
  const liveCalls = useCallStore((state) => state.liveCalls);
  const selectedCallId = useCallStore((state) => state.selectedCallId);

  // Active call resolution
  const activeCall = useMemo(() => {
    if (isSimulating && simulatedCall) {
      return simulatedCall;
    }
    return liveCalls.find(c => c.id === selectedCallId) || liveCalls[0] || null;
  }, [isSimulating, simulatedCall, liveCalls, selectedCallId]);

  // Determine user speech dynamically
  const userSpeech = useMemo(() => {
    if (dialogMap[nodeId]) {
      // Dynamic adjustments for Node 4 (selection step)
      if (nodeId === '4') {
        const option = activeCall?.selectedOption || (simPath === 'agent' ? '2' : '1');
        return option === '2'
          ? "Prefiero hablar con un agente. Pulso la tecla dos."
          : "Quiero pagar la factura, pulso la tecla uno.";
      }
      return dialogMap[nodeId].user;
    }

    // Dynamic fallback generation for custom designer nodes
    const promptLower = (voicePrompt || '').toLowerCase();
    const labelLower = (nodeLabel || '').toLowerCase();

    if (promptLower.includes('pago') || promptLower.includes('tarjeta') || promptLower.includes('euros') || labelLower.includes('pago') || labelLower.includes('payment')) {
      return "Sí, quiero confirmar el pago seguro con tarjeta.";
    }
    if (promptLower.includes('agente') || promptLower.includes('soporte') || promptLower.includes('ayuda') || labelLower.includes('agent') || labelLower.includes('agente') || labelLower.includes('transfer')) {
      return "Hola, necesito hablar con un operador para recibir soporte.";
    }
    if (promptLower.includes('identifica') || promptLower.includes('teléfono') || promptLower.includes('seguridad') || labelLower.includes('auth') || labelLower.includes('verific')) {
      return "De acuerdo, confirmo mi número y mi identidad.";
    }
    if (promptLower.includes('bienvenido') || promptLower.includes('saludo') || labelLower.includes('welcome') || labelLower.includes('bienvenid')) {
      return "Hola, buenas tardes. Gracias.";
    }

    return "Entendido, procedamos con el siguiente paso.";
  }, [nodeId, nodeLabel, voicePrompt, simPath, activeCall]);

  const botSpeech = voicePrompt || dialogMap[nodeId]?.bot || "Estableciendo conexión en la línea de voz...";

  // Sequence state management
  const [showBot, setShowBot] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [userTyping, setUserTyping] = useState(false);

  useEffect(() => {
    // Reset sequence on node active change
    setShowBot(true);
    setShowUser(false);
    setUserTyping(false);

    // After bot starts speaking, initiate user speaking sequence
    const userTypingTimeout = setTimeout(() => {
      setShowUser(true);
      setUserTyping(true);
    }, 1500);

    // After typing indicator, reveal transcribed text
    const userRevealTimeout = setTimeout(() => {
      setUserTyping(false);
    }, 2800);

    return () => {
      clearTimeout(userTypingTimeout);
      clearTimeout(userRevealTimeout);
    };
  }, [nodeId]);

  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-5 flex flex-col space-y-3 w-[290px] z-50 pointer-events-none select-none">
      {/* Bot TTS Bubble */}
      {showBot && (
        <div className="animate-bubble-in opacity-0 self-start mr-4 max-w-[270px] pointer-events-auto bg-[#141416]/95 backdrop-blur-xl border border-indigo-500/30 text-indigo-100 rounded-2xl rounded-bl-none p-3 shadow-[0_8px_32px_rgba(99,102,241,0.25)] flex flex-col space-y-1.5 transition-all">
          <div className="flex items-center justify-between border-b border-indigo-500/10 pb-1">
            <div className="flex items-center space-x-1">
              <Bot size={12} className="text-indigo-400 shrink-0" />
              <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase">BOT VOICE (TTS)</span>
            </div>
            {/* Animated Sound Wave bars */}
            <div className="flex items-end space-x-0.5 h-3.5 px-1 shrink-0">
              <div className="w-0.5 bg-indigo-400 rounded-full h-3 origin-bottom animate-wave-bar-1" />
              <div className="w-0.5 bg-indigo-400 rounded-full h-3 origin-bottom animate-wave-bar-2" />
              <div className="w-0.5 bg-indigo-400 rounded-full h-3 origin-bottom animate-wave-bar-3" />
            </div>
          </div>
          <p className="text-[11px] font-medium leading-normal text-slate-100 antialiased">
            <WordTypewriterText text={botSpeech} speed={120} />
          </p>
        </div>
      )}

      {/* User STT Bubble */}
      {showUser && (
        <div className="animate-bubble-in opacity-0 self-end ml-4 max-w-[270px] pointer-events-auto bg-[#141416]/95 backdrop-blur-xl border border-emerald-500/30 text-emerald-100 rounded-2xl rounded-br-none p-3 shadow-[0_8px_32px_rgba(16,185,129,0.25)] flex flex-col space-y-1.5 transition-all">
          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1">
            <div className="flex items-center space-x-1">
              <Mic size={11} className="text-emerald-400 shrink-0 animate-stt-pulse" />
              <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">USUARIO (STT)</span>
            </div>
            {userTyping && (
              <span className="text-[8px] font-bold text-emerald-400/60 uppercase tracking-wider animate-pulse">
                Transcribiendo...
              </span>
            )}
          </div>
          {userTyping ? (
            <div className="flex items-center space-x-2 py-1">
              {/* Typing Dot Loader */}
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] italic font-medium text-emerald-400/70">Escuchando voz...</span>
            </div>
          ) : (
            <p className="text-[11px] font-medium leading-normal text-slate-100 antialiased">
              <WordTypewriterText text={userSpeech} speed={100} />
            </p>
          )}
        </div>
      )}
    </div>
  );
};
