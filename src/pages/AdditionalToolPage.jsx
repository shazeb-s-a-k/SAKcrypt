import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Copy, Download, FileImage, Play, RotateCcw } from 'lucide-react';
import ToolHeader from '../components/ToolHeader';
import { getAdditionalTool, runAdditionalTool } from '../utils/additionalTools';

const getInitialFields = tool => Object.fromEntries(
  (tool?.fields || []).map(field => [field.name, field.defaultValue ?? ''])
);

const getTextFilename = id => {
  const filenames = {
    'gitignore-generator': '.gitignore',
    'env-example-generator': '.env.example',
    'robots-txt-generator': 'robots.txt'
  };
  if (filenames[id]) return filenames[id];
  const extensions = {
    'json-to-xml': 'xml',
    'json-to-yaml-document': 'yaml',
    'json-array-to-ndjson': 'ndjson',
    'csv-to-markdown-table': 'md',
    'markdown-checklist-generator': 'md',
    'html-table-to-csv': 'csv',
    'html-to-plain-text': 'txt',
    'svg-data-url-converter': 'txt',
    'text-to-data-url': 'txt',
    'json-object-to-typescript': 'ts',
    'csv-transposer': 'csv',
    'csv-deduplicator': 'csv',
    'csv-row-sorter': 'csv',
    'csv-row-filter': 'csv',
    'markdown-toc-generator': 'md',
    'markdown-table-to-csv': 'csv',
    'json-flattener': 'json',
    'json-pointer-query': 'json',
    'json-to-sql-insert': 'sql',
    'json-to-go-struct': 'go',
    'sql-in-clause-generator': 'sql',
    'css-px-rem-converter': 'css',
    'css-clamp-generator': 'css',
    'css-grid-generator': 'css',
    'http-fetch-snippet-generator': 'js'
  };
  if (extensions[id]) return `${id}.${extensions[id]}`;
  if (/(json|query|header)/i.test(id)) return `${id}.json`;
  if (/(yaml|yml)/i.test(id)) return `${id}.yaml`;
  if (/(svg)/i.test(id)) return `${id}.svg`;
  if (/(csv)/i.test(id)) return `${id}.csv`;
  if (/(xml)/i.test(id)) return `${id}.xml`;
  if (/(html)/i.test(id)) return `${id}.html`;
  if (/(css)/i.test(id)) return `${id}.css`;
  return `${id}.txt`;
};

const AdditionalToolContent = ({ toolId }) => {
  const tool = getAdditionalTool(toolId);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState(() => getInitialFields(tool));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const runIdRef = useRef(0);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const url = typeof result === 'object' ? result?.url : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [result]);

  const handleRun = async event => {
    event.preventDefault();
    if (isWorking) return;
    setError('');
    setCopied(false);
    setIsWorking(true);
    const runId = ++runIdRef.current;
    try {
      const output = await runAdditionalTool(tool.id, tool.inputMode === 'image' ? file : input, options);
      if (runIdRef.current !== runId) return;
      if (typeof output === 'string') {
        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
        setResult({
          text: output,
          value: blob,
          filename: getTextFilename(tool.id),
          url: URL.createObjectURL(blob)
        });
      } else {
        setResult({ ...output, url: URL.createObjectURL(output.value) });
      }
    } catch (runError) {
      if (runIdRef.current !== runId) return;
      setResult(null);
      setError(runError.message || 'This tool could not process the input.');
    } finally {
      if (runIdRef.current === runId) setIsWorking(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.text || '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      setError(`Could not access the clipboard. Select the result and copy it manually. ${copyError.message}`);
    }
  };

  if (!tool) {
    return (
      <section className="additional-tool-page">
        <ToolHeader title="Tool not found" subtitle="That tool is not available in this suite." />
      </section>
    );
  }

  return (
    <section className="additional-tool-page">
      <ToolHeader title={tool.title} subtitle={tool.desc} />
      <form className="additional-tool-card" onSubmit={handleRun}>
        {tool.inputMode === 'image' ? (
          <label className="additional-tool-upload">
            <FileImage size={20} />
            <span>{file ? file.name : 'Choose an image from your device'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={event => {
                setFile(event.target.files?.[0] || null);
                setResult(null);
                setError('');
              }}
            />
          </label>
        ) : tool.requiresInput !== false ? (
          <label className="additional-tool-source">
            <span>{tool.inputLabel}</span>
            <textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={tool.placeholder}
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              rows={9}
            />
          </label>
        ) : null}

        {tool.fields.length > 0 && (
          <div className="additional-tool-fields">
            {tool.fields.map(field => (
              <label key={field.name}>
                <span>{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    value={options[field.name] ?? field.defaultValue ?? ''}
                    onChange={event => setOptions(previous => ({ ...previous, [field.name]: event.target.value }))}
                  >
                    {field.options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={options[field.name] ?? ''}
                    onChange={event => setOptions(previous => ({ ...previous, [field.name]: event.target.value }))}
                    placeholder={field.placeholder || ''}
                    rows={field.rows || 4}
                    spellCheck="false"
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={options[field.name] ?? ''}
                    onChange={event => setOptions(previous => ({ ...previous, [field.name]: event.target.value }))}
                    placeholder={field.placeholder || ''}
                  />
                )}
              </label>
            ))}
          </div>
        )}

        <div className="additional-tool-actions">
          <button type="submit" className="additional-tool-run" disabled={isWorking}>
            <Play size={16} /> {isWorking ? 'Working…' : 'Run locally'}
          </button>
          <button
            type="button"
            className="additional-tool-reset"
            onClick={() => {
              setInput('');
              setFile(null);
              setOptions(getInitialFields(tool));
              setResult(null);
              setError('');
            }}
          >
            <RotateCcw size={15} /> Clear
          </button>
          <p>Runs in your browser. Your input is not uploaded.</p>
        </div>

        {error && <p className="additional-tool-error" role="alert">{error}</p>}

        {result != null && (
          <div className="additional-tool-result">
            <div className="additional-tool-result-heading">
              <strong>Result</strong>
              <div>
                {typeof result.text === 'string' && (
                  <button type="button" onClick={handleCopy} aria-label="Copy result">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
                {typeof result === 'object' && result.url && (
                  <a href={result.url} download={result.filename}>
                    <Download size={16} /> Download
                  </a>
                )}
              </div>
            </div>
            {typeof result.text === 'string' ? (
              <textarea className="additional-tool-output" readOnly value={result.text} aria-label="Tool result" />
            ) : result.value instanceof Blob && result.value.type.startsWith('image/') ? (
              <div className="additional-tool-image-result">
                <img src={result.url} alt="Processed tool result" />
                <p>{result.filename} · {(result.value.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <p>File ready: {result.filename || 'Download the result to continue.'}</p>
            )}
          </div>
        )}
      </form>
    </section>
  );
};

const AdditionalToolPage = () => {
  const { toolId } = useParams();
  return <AdditionalToolContent key={toolId} toolId={toolId} />;
};

export default AdditionalToolPage;
