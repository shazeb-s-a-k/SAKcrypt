import React, { useState, useEffect, useRef } from 'react';
import { Radio, Mic, Volume2, Square, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import factory from 'ggwave';

const SonicTransfer = () => {
  const [text, setText] = useState('');
  const [receivedText, setReceivedText] = useState('');
  const [mode, setMode] = useState('transmit');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ggwaveInstance, setGgwaveInstance] = useState(null);
  const [gg, setGg] = useState(null);
  const showToast = useToast();

  const audioCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const scriptNodeRef = useRef(null);

  useEffect(() => {
    // Initialize ggwave
    factory().then(ggwave => {
      ggwave.disableLog();
      const parameters = ggwave.getDefaultParameters();
      parameters.sampleFormatOut = ggwave.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
      parameters.sampleFormatInp = ggwave.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
      const instance = ggwave.init(parameters);
      setGgwaveInstance(instance);
      setGg(ggwave);
    }).catch(err => {
      console.error("Failed to load ggwave:", err);
      showToast('Error loading audio engine', 'error');
    });

    return () => {
      stopListening();
    };
  }, []);

  const transmit = () => {
    if (!text) {
      showToast('Enter some text to transmit', 'error');
      return;
    }
    if (ggwaveInstance === null || !gg) return;

    try {
      setIsTransmitting(true);
      
      const chunks = [];
      // ggwave has a payload limit (usually ~140 bytes), so chunk the text to transmit large amounts
      for (let i = 0; i < text.length; i += 100) {
        chunks.push(text.slice(i, i + 100));
      }
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext({ sampleRate: 48000 });
      audioCtxRef.current = ctx;

      let currentTime = ctx.currentTime;
      
      chunks.forEach((chunk, index) => {
        const waveform = gg.encode(ggwaveInstance, chunk, gg.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST, 10);
        const floatArr = new Float32Array(waveform.buffer, waveform.byteOffset, waveform.byteLength / 4);
        
        const buffer = ctx.createBuffer(1, floatArr.length, ctx.sampleRate);
        buffer.getChannelData(0).set(floatArr);
  
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        
        // Start the chunk at the scheduled time. Add a small 0.5s gap between chunks.
        source.start(currentTime);
        currentTime += buffer.duration + 0.5;
  
        // Only trigger completion when the LAST chunk finishes
        if (index === chunks.length - 1) {
          source.onended = () => {
            setIsTransmitting(false);
            ctx.close();
          };
        }
      });
    } catch (err) {
      console.error(err);
      setIsTransmitting(false);
      showToast('Failed to transmit audio', 'error');
    }
  };

  const startListening = async () => {
    if (ggwaveInstance === null || !gg) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      mediaStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext({ sampleRate: 48000 });
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      
      // Use ScriptProcessorNode (deprecated but widely supported and easiest for raw PCM capture)
      const bufferSize = 4096;
      const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
      scriptNodeRef.current = scriptNode;

      scriptNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // ggwave expects Int8Array byte buffer of floats
        const bytes = new Int8Array(inputData.buffer, inputData.byteOffset, inputData.byteLength);
        
        const decoded = gg.decode(ggwaveInstance, bytes);
        if (decoded && decoded.length > 0) {
          const resultText = new TextDecoder().decode(decoded);
          setReceivedText(prev => prev ? prev + '\n' + resultText : resultText);
          showToast('Data received!', 'success');
        }
      };

      source.connect(scriptNode);
      scriptNode.connect(ctx.destination); // Required for scriptNode to fire

      setIsListening(true);
    } catch (err) {
      console.error(err);
      showToast('Microphone access denied or error', 'error');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
      scriptNodeRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '8s' }}
    >
      <ToolHeader title="Sonic Transfer" subtitle="Transmit text to nearby devices using sound waves" />

      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
        <button 
          className={`btn-primary ${mode === 'transmit' ? '' : 'inactive'}`} 
          onClick={() => { setMode('transmit'); stopListening(); }}
          style={{ background: mode === 'transmit' ? 'var(--primary)' : 'transparent', color: mode === 'transmit' ? '#000' : 'var(--primary)', border: '1px solid var(--primary)' }}
        >
          <Volume2 className="icon-sm" /> Transmit
        </button>
        <button 
          className={`btn-primary ${mode === 'receive' ? '' : 'inactive'}`} 
          onClick={() => setMode('receive')}
          style={{ background: mode === 'receive' ? 'var(--primary)' : 'transparent', color: mode === 'receive' ? '#000' : 'var(--primary)', border: '1px solid var(--primary)' }}
        >
          <Mic className="icon-sm" /> Receive
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {mode === 'transmit' ? (
          /* Transmitter Panel */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-card" 
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
              <Volume2 className="icon-sm" style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, color: '#fff' }}>Transmit Payload</h3>
            </div>
            
            <textarea 
              className="textarea-glass"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to broadcast over audio..."
              style={{ minHeight: '180px' }}
              disabled={isTransmitting}
            />
            
            <button 
              className="btn-primary" 
              onClick={transmit} 
              disabled={isTransmitting || !text || ggwaveInstance === null}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              {isTransmitting ? (
                <><RefreshCw className="icon-sm spin" /> Transmitting...</>
              ) : (
                <><Radio className="icon-sm" /> Broadcast via Sound</>
              )}
            </button>
          </motion.div>
        ) : (
          /* Receiver Panel */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-card" 
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Mic className="icon-sm" style={{ color: isListening ? '#ef4444' : 'var(--primary)' }} />
                <h3 style={{ margin: 0, color: '#fff' }}>Listen for Payload</h3>
              </div>
              {isListening && (
                <span style={{ fontSize: '0.8rem', color: '#ef4444', animation: 'pulse 1.5s infinite' }}>Listening...</span>
              )}
            </div>
            
            <textarea 
              className="textarea-glass"
              value={receivedText}
              readOnly
              placeholder="Listening for nearby sonic transmissions..."
              style={{ minHeight: '180px', background: isListening ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.05)' }}
            />
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                className="btn-primary" 
                onClick={isListening ? stopListening : startListening} 
                disabled={ggwaveInstance === null || isTransmitting}
                style={{ flex: 1, justifyContent: 'center', background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--primary)', border: isListening ? '1px solid #ef4444' : 'none', color: isListening ? '#ef4444' : '#000' }}
              >
                {isListening ? (
                  <><Square className="icon-sm" /> Stop Listening</>
                ) : (
                  <><Mic className="icon-sm" /> Start Listening</>
                )}
              </button>
              
              <button 
                className="btn-primary" 
                onClick={() => setReceivedText('')} 
                style={{ background: 'transparent', border: '1px solid var(--border)' }}
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SonicTransfer;
