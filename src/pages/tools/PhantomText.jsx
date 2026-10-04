import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Volume2, VolumeX, ShieldCheck, Trash2, Upload, Download, Image as ImageIcon } from 'lucide-react';
import { encodeMorse, decodeMorse, isPhantomText } from '../../utils/morse';
import { playMorseAudio, stopAudio } from '../../utils/audio';
import { useSupport } from '../../components/SupportProvider';
import '../../index.css';

const MAX_FILE_SIZE = 100 * 1024; // 100KB

function PhantomText() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('stealth');
  const [toastMessage, setToastMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ chars: 0, bytes: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const showSupport = useSupport();

  useEffect(() => {
    if (!inputText) {
      setOutputText('');
      setStats({ chars: 0, bytes: 0 });
      return;
    }
    if (isPhantomText(inputText)) {
      const decoded = decodeMorse(inputText);
      setOutputText(decoded);
      calculateStats(decoded);
    } else {
      const encoded = encodeMorse(inputText, mode);
      setOutputText(encoded);
      calculateStats(encoded);
    }
  }, [inputText, mode]);

  const calculateStats = (text) => {
    const bytes = new Blob([text]).size;
    setStats({ chars: text.length, bytes });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCopy = async (textToCopy) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('Copied to clipboard!');
      if (!isPhantomText(inputText)) {
        const histOriginal = textToCopy.startsWith('data:') ? '[Media File]' : inputText;
        addToHistory(histOriginal, textToCopy, mode);
        setTimeout(showSupport, 1000);
      } else {
        setTimeout(showSupport, 1500);
      }
    } catch (err) {
      showToast('Failed to copy');
    }
  };

  const addToHistory = (original, encoded, usedMode) => {
    setHistory(prev => {
      if (prev.some(item => item.original === original && item.mode === usedMode)) return prev;
      const newHistory = [{ id: Date.now(), original, encoded, mode: usedMode }, ...prev];
      return newHistory.slice(0, 10);
    });
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      const textToPlay = isPhantomText(inputText) ? outputText : inputText;
      if (!textToPlay || isMedia(textToPlay)) {
         if (isMedia(textToPlay)) showToast('Cannot play audio for media files');
         return;
      }
      setIsPlaying(true);
      playMorseAudio(textToPlay, () => {
        setIsPlaying(false);
      });
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
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
      setInputText(e.target.result);
      showToast('Media loaded!');
    };
    reader.onerror = () => showToast('Failed to read file');
    reader.readAsDataURL(file);
  };

  const isMedia = (text) => text.startsWith('data:image/') || text.startsWith('data:video/');

  const renderOutput = () => {
    if (isMedia(outputText)) {
      const isVideo = outputText.startsWith('data:video/');
      return (
        <div className="media-preview-container">
          {isVideo ? (
            <video src={outputText} controls className="media-preview" />
          ) : (
            <img src={outputText} alt="Decoded" className="media-preview" />
          )}
          <div className="media-actions">
            <a href={outputText} download="phantom_media" className="download-btn">
              <Download className="icon-sm" /> Download File
            </a>
          </div>
        </div>
      );
    }
    return (
      <textarea 
        value={outputText}
        readOnly
        placeholder="Result appears here instantly..."
        className={mode === 'stealth' && outputText && !isPhantomText(inputText) ? 'hidden-text-area' : ''}
      />
    );
  };

  return (
    <div 
      className={`app-container ${isDragging ? 'dragging' : ''}`}
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

      <main className="main-content">
        <div className="header-container">
          <h1>Phantom Text</h1>
          <p className="subtitle">Secure, invisible Morse code encoding.</p>
        </div>

        <div className="card">
          <div className="mode-toggle">
            <button 
              className={`toggle-btn ${mode === 'stealth' ? 'active' : ''}`}
              onClick={() => setMode('stealth')}
            >
              <EyeOff className="icon-sm" /> Stealth
            </button>
            <button 
              className={`toggle-btn ${mode === 'obscure' ? 'active' : ''}`}
              onClick={() => setMode('obscure')}
            >
              <Eye className="icon-sm" /> Obscure
            </button>
          </div>

          <div className="io-section">
            <div className="textarea-wrapper">
              <div className="textarea-header">
                <label>Input</label>
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
                  <button className="icon-btn" onClick={() => setInputText('')} title="Clear">
                    <Trash2 className="icon-sm" />
                  </button>
                </div>
              </div>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type text, paste Phantom text, or drag & drop media..."
              />
            </div>

            <div className="textarea-wrapper">
              <div className="textarea-header">
                <label>Output</label>
                <div className="textarea-actions">
                  <button className="icon-btn" onClick={toggleAudio} title={isPlaying ? "Stop" : "Listen"}>
                    {isPlaying ? <VolumeX className="icon-sm playing-animation" /> : <Volume2 className="icon-sm" />}
                  </button>
                  <button className="icon-btn" onClick={() => handleCopy(outputText)} title="Copy">
                    <Copy className="icon-sm" />
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                {renderOutput()}
                {!isPhantomText(inputText) && outputText && mode === 'stealth' && !isMedia(outputText) && (
                  <div className="stealth-indicator">
                    <ShieldCheck className="icon-sm" /> Invisible Text Ready
                  </div>
                )}
              </div>
              <div className="stats">
                {stats.chars > 0 ? `${stats.chars} chars • ~${stats.bytes} bytes` : ''}
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="sidebar">
        <h3>Recent Encodings</h3>
        {history.length === 0 ? (
          <div className="empty-state">No recent activity.</div>
        ) : (
          <div className="history-list">
            {history.map(item => (
              <div key={item.id} className="history-item">
                <div className="history-text" title={item.original}>{item.original}</div>
                <div className="history-type">Mode: {item.mode}</div>
                <button className="icon-btn history-copy" onClick={() => handleCopy(item.encoded)}>
                  <Copy className="icon-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      <div className={`toast ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>

    </div>
  );
}

export default PhantomText;
