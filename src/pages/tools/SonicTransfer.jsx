import React, { useState, useEffect, useRef } from 'react';
import { Radio, Mic, Volume2, Square, RefreshCw, Copy, Upload, Download, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';
import factory from 'ggwave';

const MAX_FILE_SIZE = 100 * 1024; // 100KB

const SonicTransfer = () => {
  const [text, setText] = useState('');
  const [receivedText, setReceivedText] = useState('');
  const [mode, setMode] = useState('transmit');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitProgress, setTransmitProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [ggwaveInstance, setGgwaveInstance] = useState(null);
  const [gg, setGg] = useState(null);
  const showToast = useToast();
  const showSupport = useSupport();

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

  const handleCopy = () => {
    if (!receivedText) return;
    navigator.clipboard.writeText(receivedText);
    showToast('Copied to clipboard!', 'success');
    setTimeout(showSupport, 1000);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (mode === 'transmit') setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (mode !== 'transmit') return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files[0]);
    }
  };

  const handleFileDrop = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      showToast(`File too large! Max size is ${Math.round(MAX_FILE_SIZE/1024)}KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setText(e.target.result);
      showToast('Media loaded for transmission!');
    };
    reader.onerror = () => showToast('Failed to read file');
    reader.readAsDataURL(file);
  };

  const isMedia = (dataString) => {
    if (!dataString) return false;
    return dataString.startsWith('data:image/') || dataString.startsWith('data:video/');
  };

  const transmit = () => {
    if (!text) {
      showToast('Enter some text to transmit', 'error');
      return;
    }
    if (ggwaveInstance === null || !gg) return;

    try {
      setIsTransmitting(true);
      setTransmitProgress(0);
      
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
  
        // Track progress when chunk finishes playing
        source.onended = () => {
          const progress = Math.round(((index + 1) / chunks.length) * 100);
          setTransmitProgress(progress);
          
          if (index === chunks.length - 1) {
            setTimeout(() => {
              setIsTransmitting(false);
              setTransmitProgress(0);
              ctx.close();
            }, 500); // give a tiny buffer at the end
          }
        };
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
          setReceivedText(prev => prev ? prev + resultText : resultText);
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
      className={`container animate-float ${isDragging ? 'dragging' : ''}`}
      style={{ animationDuration: '8s', position: 'relative' }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="drag-overlay">
          <Upload className="icon-large" />
          <h2>Drop Media Here</h2>
          <p>Images & Videos (Max 100KB)</p>
        </div>
      )}

      <ToolHeader title="Sonic Transfer" subtitle="Transmit text and media to nearby devices using sound waves" />

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
            
            <div className="textarea-wrapper">
              <div className="textarea-header">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAYLOAD (TEXT OR MEDIA)</label>
                <div className="textarea-actions">
                   <button className="icon-btn" onClick={() => {
                     const input = document.createElement('input');
                     input.type = 'file';
                     input.accept = 'image/*,video/*';
                     input.onchange = (e) => handleFileDrop(e.target.files[0]);
                     input.click();
                   }} title="Upload Media">
                    <ImageIcon className="icon-sm" />
                  </button>
                  <button className="icon-btn" onClick={() => setText('')} title="Clear">
                    <Trash2 className="icon-sm" />
                  </button>
                </div>
              </div>
              
              {isMedia(text) ? (
                <div className="media-preview-container" style={{ minHeight: '180px', marginTop: '0.5rem' }}>
                  {text.startsWith('data:video/') ? (
                    <video src={text} controls className="media-preview" />
                  ) : (
                    <img src={text} alt="Media to Transmit" className="media-preview" />
                  )}
                </div>
              ) : (
                <textarea 
                  className="textarea-glass"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type text, paste data, or drag & drop media..."
                  style={{ minHeight: '180px', marginTop: '0.5rem' }}
                  disabled={isTransmitting}
                />
              )}
            </div>
            
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

            {isTransmitting && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Broadcast Progress</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{transmitProgress}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${transmitProgress}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }}
                  />
                </div>
              </div>
            )}
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
            
            {isMedia(receivedText) ? (
              <div className="media-preview-container" style={{ minHeight: '180px' }}>
                {receivedText.startsWith('data:video/') ? (
                  <video src={receivedText} controls className="media-preview" />
                ) : (
                  <img src={receivedText} alt="Received Media" className="media-preview" />
                )}
                <div className="media-actions">
                  <a href={receivedText} download="sonic_media" className="download-btn" onClick={() => setTimeout(showSupport, 1000)}>
                    <Download className="icon-sm" /> Download File
                  </a>
                </div>
              </div>
            ) : (
              <textarea 
                className="textarea-glass"
                value={receivedText}
                readOnly
                placeholder="Listening for nearby sonic transmissions..."
                style={{ minHeight: '180px', background: isListening ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.05)' }}
              />
            )}
            
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
              
              {!isMedia(receivedText) && (
                <button 
                  className="btn-primary" 
                  onClick={handleCopy} 
                  disabled={!receivedText}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: receivedText ? 'var(--primary)' : 'var(--text-muted)' }}
                  title="Copy Received Text"
                >
                  <Copy className="icon-sm" /> Copy
                </button>
              )}

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
