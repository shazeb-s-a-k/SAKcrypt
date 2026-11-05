import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import {
  Bot, Check, ChevronDown, Copy, Download, FilePlus2, FileText, FolderOpen,
  Send, Settings2, ShieldCheck, Sparkles
} from 'lucide-react';
import { runAssistantTool } from '../utils/assistantTools';

const scoreTools = (query, tools) => {
  const normalizedQuery = query.toLowerCase().replace(/([a-z])[-_]([a-z])/g, '$1$2');
  const words = normalizedQuery.match(/[a-z0-9+#.]+/g) || [];
  const stopWords = new Set(['a', 'an', 'and', 'can', 'do', 'for', 'help', 'how', 'i', 'in', 'is', 'me', 'my', 'need', 'please', 'the', 'to', 'want', 'with']);
  const shortToolNames = new Set(['ai', 'api', 'css', 'dns', 'ip', 'js', 'jwt', 'qr', 'sql', 'svg', 'ts', 'url', 'xml']);
  const genericWords = new Set(['check', 'code', 'convert', 'create', 'file', 'format', 'generate', 'generator', 'make', 'test', 'tool', 'tools']);
  const meaningfulWords = words.filter(word => !stopWords.has(word) && (word.length > 2 || shortToolNames.has(word)));
  const hasSpecificTerms = meaningfulWords.some(word => !genericWords.has(word));

  return tools.filter(tool => !tool.comingSoon).map(tool => {
    const title = tool.title.toLowerCase();
    const description = tool.desc.toLowerCase();
    const tag = (tool.tag || '').toLowerCase();
    const category = tool.categoryId.toLowerCase();
    const score = meaningfulWords.reduce((total, word) => {
      const weight = hasSpecificTerms && genericWords.has(word) ? 1 : 5;
      if (title.includes(word)) return total + weight;
      if (tag.includes(word)) return total + (weight - 1);
      if (category.includes(word)) return total + (weight - 2);
      if (description.includes(word)) return total + (hasSpecificTerms && genericWords.has(word) ? 0 : 1);
      return total;
    }, 0);

    return { tool, score };
  }).filter(result => result.score >= (hasSpecificTerms ? 4 : 1))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(result => result.tool);
};

const isSupportedTextFile = file => file.type.startsWith('text/')
  || /\.(txt|md|json|html|css|js|jsx|ts|tsx|py)$/i.test(file.name);

const getCatalogContext = (tools, categories) => tools.map(tool => {
  const category = categories.find(item => item.id === tool.categoryId);
  const route = tool.comingSoon ? 'Coming soon; not available yet.' : `Route: ${tool.path}`;
  return `- ${tool.title} [${category?.name || tool.categoryId}] (${tool.tag || 'READY'}): ${tool.desc} ${route}`;
}).join('\n');

const requestAssistantReply = async ({ prompt, messages, catalog }) => {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      history: messages
        .filter(message => message.role !== 'error')
        .slice(-10)
        .map(message => ({ role: message.role, content: message.content })),
      catalog
    })
  });
  const { data } = await readAssistantResponse(response);
  if (!response.ok) throw new Error(data.error || `Assistant request failed (${response.status}).`);
  if (!data.answer) throw new Error('The assistant returned an empty response.');
  return data.answer;
};

const readAssistantResponse = async response => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const preview = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
    if (!contentType.toLowerCase().includes('json')) {
      throw new Error(
        `Assistant API returned a non-JSON response (HTTP ${response.status}${contentType ? `, ${contentType}` : ''}). `
        + `${preview || 'The response was empty.'} Check that the latest Vercel deployment includes /api/assistant.`
      );
    }
    throw new Error(`Assistant API returned invalid JSON (HTTP ${response.status}).`);
  }
  return { data };
};

const SAKAI = ({ tools, categories }) => {
  const [provider, setProvider] = useState('gemini');
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileHandle, setFileHandle] = useState(null);
  const [includeFile, setIncludeFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [assistantError, setAssistantError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');
  const [copiedToolOutput, setCopiedToolOutput] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const catalog = useMemo(() => getCatalogContext(tools, categories), [tools, categories]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/assistant', { signal: controller.signal })
      .then(async response => {
        const { data } = await readAssistantResponse(response);
        if (!response.ok) throw new Error(data.error || `Assistant status check failed (${response.status}).`);
        setApiStatus(data.configured ? 'ready' : 'missing-key');
      })
      .catch(error => {
        if (error.name !== 'AbortError') setApiStatus('unavailable');
      });
    return () => controller.abort();
  }, []);

  const openFile = async () => {
    setFileError('');
    if (!window.showOpenFilePicker) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: 'Text and source files',
          accept: {
            'text/*': ['.txt', '.md', '.json', '.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.py']
          }
        }]
      });
      const selectedFile = await handle.getFile();
      if (!isSupportedTextFile(selectedFile)) {
        throw new Error('Choose a supported text or source file.');
      }
      if (selectedFile.size > 200 * 1024) {
        throw new Error('For privacy and performance, files must be 200 KB or smaller.');
      }
      setFile({ name: selectedFile.name, content: await selectedFile.text() });
      setFileHandle(handle);
      setIncludeFile(false);
    } catch (error) {
      if (error.name !== 'AbortError') setFileError(error.message || 'Could not open that file.');
    }
  };

  const handleFileInput = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFileError('');
    setFileHandle(null);
    try {
      if (!isSupportedTextFile(selectedFile)) {
        throw new Error('Choose a supported text or source file.');
      }
      if (selectedFile.size > 200 * 1024) {
        throw new Error('For privacy and performance, files must be 200 KB or smaller.');
      }
      setFile({ name: selectedFile.name, content: await selectedFile.text() });
      setIncludeFile(false);
    } catch (error) {
      setFile(null);
      setFileError(error.message || 'Could not read that file.');
    }
    event.target.value = '';
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const nextUserMessage = { role: 'user', content: prompt };
    const providerPrompt = includeFile && file
      ? `${prompt}\n\nSelected file: ${file.name}\n\`\`\`\n${file.content}\n\`\`\``
      : prompt;
    const priorMessages = messages;
    setMessages(previous => [...previous, nextUserMessage]);
    setRecommendations(scoreTools(prompt, tools));
    setInput('');
    if (includeFile) setIncludeFile(false);
    setAssistantError('');
    setIsLoading(true);

    try {
      const toolResult = await runAssistantTool(prompt, includeFile ? file?.content : '');
      if (toolResult) {
        setMessages(previous => [...previous, {
          role: 'assistant',
          content: toolResult.needsInput
            ? toolResult.message
            : `Ran **${toolResult.tool}** locally in your browser. ${toolResult.tool === 'Phantom Text' ? 'This is invisible Morse encoding, not encryption.' : ''}`,
          toolResult: toolResult.needsInput ? null : toolResult
        }]);
      } else if (provider === 'offline') {
        const matches = scoreTools(prompt, tools);
        const answer = matches.length
          ? `I found ${matches.length} relevant tool${matches.length === 1 ? '' : 's'}. I can run a few common text tasks directly here; for other tools, open a match below and use it in the suite.`
          : 'I could not find a close tool match. Try describing the task in a few words, or browse the categories below.';
        setMessages(previous => [...previous, { role: 'assistant', content: answer }]);
      } else {
        const answer = await requestAssistantReply({
          prompt: providerPrompt,
          messages: priorMessages,
          catalog
        });
        setMessages(previous => [...previous, { role: 'assistant', content: answer }]);
      }
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    } catch (error) {
      setAssistantError(error.message || 'The assistant request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const latestAnswer = [...messages].reverse().find(message => message.role === 'assistant')?.content;
  const copyToolOutput = async (output, index) => {
    try {
      await navigator.clipboard.writeText(output);
      setCopiedToolOutput(index);
      window.setTimeout(() => setCopiedToolOutput(current => current === index ? null : current), 2000);
    } catch (error) {
      const outputField = document.getElementById(`sak-ai-result-${index}`);
      outputField?.focus();
      outputField?.select();
      setAssistantError(`Clipboard access was denied. The result is selected for manual copying. ${error.message}`);
    }
  };
  const downloadAnswer = (content, filename) => {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveAsFile = async () => {
    if (!latestAnswer) return;
    if (!window.showSaveFilePicker) {
      downloadAnswer(latestAnswer, 'sak-ai-draft.md');
      return;
    }

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'sak-ai-draft.md',
        types: [{ description: 'Markdown file', accept: { 'text/markdown': ['.md'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(latestAnswer);
      await writable.close();
    } catch (error) {
      if (error.name !== 'AbortError') setFileError(error.message || 'Could not save the draft.');
    }
  };

  const replaceSelectedFile = async () => {
    if (!fileHandle || !latestAnswer) return;
    if (!window.confirm(`Replace ${file.name} with the latest assistant response? This cannot be undone.`)) return;

    try {
      let permission = await fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') permission = await fileHandle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') throw new Error('Write permission was not granted.');
      const writable = await fileHandle.createWritable();
      await writable.write(latestAnswer);
      await writable.close();
      setFile({ ...file, content: latestAnswer });
      setFileError('');
    } catch (error) {
      setFileError(error.message || 'Could not update the selected file.');
    }
  };

  return (
    <section className="sak-ai-panel" id="sak-ai" aria-labelledby="sak-ai-title">
      <div className="sak-ai-heading">
        <div className="sak-ai-title-group">
          <div className="sak-ai-avatar"><Bot size={23} /></div>
          <div>
            <div className={`sak-ai-eyebrow sak-ai-status-${apiStatus}`}>
              <span className="sak-ai-online-dot" />
              S.A.K AI · GEMINI 3.8
              <span className="sak-ai-status-label">
                {apiStatus === 'checking' ? 'CHECKING' : apiStatus === 'ready' ? 'READY' : apiStatus === 'missing-key' ? 'SETUP NEEDED' : 'API UNAVAILABLE'}
              </span>
            </div>
            <h2 id="sak-ai-title">S.A.K AI</h2>
            <p>Find tools across the suite and run common tasks right here.</p>
          </div>
        </div>
        <button
          type="button"
          className="sak-ai-settings-button"
          onClick={() => setShowSettings(value => !value)}
          aria-expanded={showSettings}
        >
          <Settings2 size={16} /> Assistant settings <ChevronDown size={15} />
        </button>
      </div>

      {showSettings && (
        <div className="sak-ai-settings">
          <label>
            <span>Assistant</span>
            <select value={provider} onChange={event => { setProvider(event.target.value); setAssistantError(''); }}>
              <option value="gemini">S.A.K AI · Gemini</option>
              <option value="offline">Offline tool guide</option>
            </select>
          </label>
          <p>
            {apiStatus === 'ready'
              ? 'Gemini 3.8 is configured for this deployment. The API key stays server-side.'
              : apiStatus === 'missing-key'
                ? 'GEMINI_API_KEY is missing from this deployment. Add it to the correct Vercel environment and redeploy.'
                : apiStatus === 'unavailable'
                  ? 'The assistant API is not responding. Check that the latest deployment includes /api/assistant.'
                  : 'Checking the server connection. The API key is never sent to or stored in your browser.'}
          </p>
        </div>
      )}

      <div className="sak-ai-body">
        <div className="sak-ai-conversation" aria-live="polite">
          {messages.length === 0 ? (
            <div className="sak-ai-welcome">
              <Sparkles size={20} />
              <div>
                <strong>Hi, I’m S.A.K AI.</strong>
                <p>I can search all {tools.length} tools, run common text tasks, and help you plan or draft files. What would you like to do?</p>
                <div className="sak-ai-prompt-suggestions" aria-label="Try asking">
                  {[
                    'Create stealth copyable text using Phantom Text for "Hello"',
                    'Format this JSON: {"ready":true}',
                    'Find a tool to inspect image metadata'
                  ].map(suggestion => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        document.querySelector('.sak-ai-composer textarea')?.focus();
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : messages.map((message, index) => (
            <div className={`sak-ai-message ${message.role}`} key={`${message.role}-${index}`}>
              <span className="sak-ai-message-icon">
                {message.role === 'assistant' ? <Bot size={15} /> : <span>You</span>}
              </span>
              <div className="sak-ai-message-content">
                {message.role === 'assistant'
                  ? <ReactMarkdown components={{
                    a: ({ href = '', children }) => href.startsWith('/')
                      ? <Link to={href}>{children}</Link>
                      : <a href={href} target="_blank" rel="noreferrer">{children}</a>
                  }}>{message.content}</ReactMarkdown>
                  : message.content}
                {message.toolResult && (
                  <div className={`sak-ai-tool-result ${message.toolResult.tool === 'Phantom Text' ? 'phantom-result' : ''}`}>
                    <div className="sak-ai-tool-result-heading">
                      <span><ShieldCheck size={14} /> {message.toolResult.tool} result</span>
                      <Link to={message.toolResult.path}>Open tool ↗</Link>
                    </div>
                    {message.toolResult.tool === 'Phantom Text' && (
                      <p className="sak-ai-tool-result-note">
                        The output is intentionally invisible. It contains {message.toolResult.output.length} zero-width characters; copy it to use it.
                      </p>
                    )}
                    <textarea
                      id={`sak-ai-result-${index}`}
                      readOnly
                      value={message.toolResult.output}
                      rows={message.toolResult.tool === 'Phantom Text' ? 2 : Math.min(7, Math.max(2, message.toolResult.output.split('\n').length))}
                      aria-label={`${message.toolResult.tool} output`}
                      className="sak-ai-tool-output"
                    />
                    <button
                      type="button"
                      className="sak-ai-copy-result"
                      onClick={() => copyToolOutput(message.toolResult.output, index)}
                    >
                      {copiedToolOutput === index ? <Check size={14} /> : <Copy size={14} />}
                      {copiedToolOutput === index ? 'Copied' : 'Copy result'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="sak-ai-loading"><span /> Thinking…</div>}
          <div ref={messagesEndRef} />
        </div>

        {recommendations.length > 0 && (
          <div className="sak-ai-recommendations">
            <div className="sak-ai-recommendations-title"><ShieldCheck size={15} /> Matching tools</div>
            <div className="sak-ai-tool-links">
              {recommendations.map(tool => (
                <Link to={tool.path} key={tool.title} className="sak-ai-tool-link">
                  <span>{tool.title}</span><span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {file && (
          <div className="sak-ai-file">
            <FileText size={16} />
            <span>{file.name}</span>
            <label>
              <input type="checkbox" checked={includeFile} onChange={event => setIncludeFile(event.target.checked)} />
              Include in next prompt
            </label>
            <button type="button" onClick={() => { setFile(null); setFileHandle(null); setIncludeFile(false); }}>Remove</button>
          </div>
        )}

        {fileError && <p className="sak-ai-error" role="alert">{fileError}</p>}
        {assistantError && <p className="sak-ai-error" role="alert">{assistantError}</p>}

        <form className="sak-ai-composer" onSubmit={handleSend}>
          <textarea
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask S.A.K AI to find a tool or help with a task…"
            rows={2}
            aria-label="Message S.A.K AI"
          />
          <div className="sak-ai-composer-footer">
            <div className="sak-ai-file-actions">
              <button type="button" onClick={openFile} title="Open a local text file">
                <FolderOpen size={15} /> Open file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.html,.css,.js,.jsx,.ts,.tsx,.py,text/*"
                onChange={handleFileInput}
                hidden
              />
              {latestAnswer && (
                <button type="button" onClick={saveAsFile} title="Save the latest response as a local file">
                  <Download size={15} /> Save draft
                </button>
              )}
              {latestAnswer && fileHandle && (
                <button type="button" onClick={replaceSelectedFile} title="Replace the selected file after confirmation">
                  <FilePlus2 size={15} /> Update file
                </button>
              )}
            </div>
            <button className="sak-ai-send" type="submit" disabled={!input.trim() || isLoading}>
              <Send size={15} /> Ask
            </button>
          </div>
        </form>

        <p className="sak-ai-privacy">
          <ShieldCheck size={13} />
          Tools open only when you choose them. Files stay local unless you opt to include one in a prompt; review drafts before saving.
        </p>
      </div>
    </section>
  );
};

export default SAKAI;
