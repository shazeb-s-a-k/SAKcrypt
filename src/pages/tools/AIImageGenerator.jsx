import { useEffect, useRef, useState } from 'react';
import { Archive, Download, FileText, Image as ImageIcon, LoaderCircle, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { Client } from '@gradio/client';
import JSZip from 'jszip';
import ToolHeader from '../../components/ToolHeader';
import { createImageFilename, parseImagePrompts } from '../../utils/imageBatch';

const FLUX_SPACE_ID = 'black-forest-labs/FLUX.1-schnell';
const FLUX_SPACE_URL = 'https://black-forest-labs-flux-1-schnell.hf.space';
const MAX_PROMPT_LENGTH = 1000;

async function generateImage(client, prompt) {
  const result = await client.predict('/infer', [
    prompt,
    0,
    true,
    1024,
    1024,
    4
  ]);
  const imageData = result.data[0];
  if (!imageData || typeof imageData !== 'object' || !('url' in imageData) || typeof imageData.url !== 'string') {
    throw new Error('The image service returned an invalid response. Please try again.');
  }

  const imageResponse = await fetch(new URL(imageData.url, `${FLUX_SPACE_URL}/`), {
    signal: AbortSignal.timeout(120000)
  });
  if (!imageResponse.ok) {
    throw new Error('Could not download the generated image from the public demo. Please try again.');
  }

  const blob = await imageResponse.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('The image service returned an invalid response. Please try again.');
  }
  return blob;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'The public image demo failed. Please try again later.';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const AIImageGenerator = () => {
  const [mode, setMode] = useState('single');
  const [prompt, setPrompt] = useState('');
  const [batchFileName, setBatchFileName] = useState('');
  const [batchPrompts, setBatchPrompts] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [batchFailure, setBatchFailure] = useState(null);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [serviceStatus, setServiceStatus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const clientRef = useRef(null);
  const imageUrlsRef = useRef([]);
  const cancelBatchRef = useRef(false);

  useEffect(() => () => {
    clientRef.current?.close();
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const clearGeneratedImages = () => {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current = [];
    setGeneratedImages([]);
  };

  const createClient = async () => {
    setServiceStatus('Connecting to the public image demo...');
    const client = await Client.connect(FLUX_SPACE_ID, {
      status_callback: (status) => {
        if (status.status === 'sleeping' || status.status === 'building') {
          setServiceStatus('Waking the public image demo. Please wait...');
        }
      }
    });
    clientRef.current = client;
    return client;
  };

  const saveGeneratedImage = (blob, imagePrompt, sequence, total) => {
    const url = URL.createObjectURL(blob);
    imageUrlsRef.current.push(url);
    return {
      prompt: imagePrompt,
      blob,
      url,
      filename: createImageFilename(imagePrompt, sequence, total, blob.type)
    };
  };

  const handleGenerateSingle = async (event) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isGenerating) return;

    clearGeneratedImages();
    setIsGenerating(true);
    setError('');
    setBatchFailure(null);
    setServiceStatus('Connecting to the public image demo...');

    let client;
    try {
      client = await createClient();
      setServiceStatus('Generating your image...');
      const blob = await generateImage(client, trimmedPrompt);
      setGeneratedImages([saveGeneratedImage(blob, trimmedPrompt, 1, 1)]);
      setServiceStatus('');
    } catch (generationError) {
      setError(getErrorMessage(generationError));
      setServiceStatus('');
    } finally {
      client?.close();
      if (clientRef.current === client) clientRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleBatchFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBatchFileName(file.name);
    setBatchPrompts([]);
    setError('');
    setBatchFailure(null);
    clearGeneratedImages();

    try {
      const text = await file.text();
      const prompts = parseImagePrompts(text);
      if (prompts.length === 0) {
        throw new Error('This file does not contain any prompts. Put one prompt on each non-empty line.');
      }
      setBatchPrompts(prompts);
      setBatchProgress({ completed: 0, total: prompts.length });
    } catch (fileError) {
      setError(getErrorMessage(fileError));
      setBatchFileName('');
    }

    event.target.value = '';
  };

  const handleGenerateBatch = async () => {
    if (batchPrompts.length === 0 || isGenerating) return;

    clearGeneratedImages();
    setIsGenerating(true);
    setError('');
    setBatchFailure(null);
    setBatchProgress({ completed: 0, total: batchPrompts.length });
    cancelBatchRef.current = false;

    let client;
    let completedCount = 0;
    try {
      client = await createClient();

      for (let index = 0; index < batchPrompts.length; index += 1) {
        if (cancelBatchRef.current) break;

        const currentNumber = index + 1;
        const currentPrompt = batchPrompts[index];
        setServiceStatus(`Generating image ${currentNumber} of ${batchPrompts.length}...`);

        try {
          const blob = await generateImage(client, currentPrompt);
          const image = saveGeneratedImage(blob, currentPrompt, currentNumber, batchPrompts.length);
          setGeneratedImages((currentImages) => [...currentImages, image]);
          completedCount = currentNumber;
          setBatchProgress({ completed: completedCount, total: batchPrompts.length });
        } catch (generationError) {
          const message = getErrorMessage(generationError);
          setBatchFailure({ index: currentNumber, prompt: currentPrompt, message });
          setError(`Stopped at prompt ${currentNumber} of ${batchPrompts.length}: ${message}`);
          break;
        }
      }

      if (cancelBatchRef.current) {
        setServiceStatus(`Stopped after ${completedCount} completed images.`);
      } else {
        setServiceStatus('');
      }
    } catch (generationError) {
      setError(getErrorMessage(generationError));
      setServiceStatus('');
    } finally {
      client?.close();
      if (clientRef.current === client) clientRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleDownloadBatch = async () => {
    if (generatedImages.length === 0 || isDownloading) return;

    setIsDownloading(true);
    setError('');
    try {
      const archive = new JSZip();
      generatedImages.forEach((image) => archive.file(image.filename, image.blob));
      if (batchFailure) {
        archive.file(
          'generation-failure.txt',
          `Generation stopped at prompt ${batchFailure.index}.\n\nPrompt:\n${batchFailure.prompt}\n\nError:\n${batchFailure.message}\n`
        );
      }
      const archiveBlob = await archive.generateAsync({ type: 'blob' });
      downloadBlob(archiveBlob, 'sakrypt-generated-images.zip');
    } catch (downloadError) {
      setError(`Could not create the ZIP archive: ${getErrorMessage(downloadError)}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
    >
      <ToolHeader
        title="AI Image Generator"
        subtitle="Generate and view FLUX.1 Schnell images here"
      />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div
          role="tablist"
          aria-label="Image generation mode"
          style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}
        >
          <button
            type="button"
            className={`btn-secondary ${mode === 'single' ? 'active' : ''}`}
            role="tab"
            aria-selected={mode === 'single'}
            disabled={isGenerating}
            onClick={() => setMode('single')}
          >
            Single Generate
          </button>
          <button
            type="button"
            className={`btn-secondary ${mode === 'mass' ? 'active' : ''}`}
            role="tab"
            aria-selected={mode === 'mass'}
            disabled={isGenerating}
            onClick={() => setMode('mass')}
          >
            Mass Generate
          </button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleGenerateSingle}>
            <label
              htmlFor="image-prompt"
              style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}
            >
              IMAGE PROMPT
            </label>
            <textarea
              id="image-prompt"
              className="textarea-glass"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the image you want to create..."
              maxLength={MAX_PROMPT_LENGTH}
              required
              style={{ minHeight: '140px', resize: 'vertical' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.75rem'
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {prompt.length}/{MAX_PROMPT_LENGTH}
              </span>
              <button
                className="btn-primary"
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle size={17} className="spin" /> Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon size={17} /> Generate Image
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <label
              htmlFor="image-batch-file"
              style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}
            >
              PROMPT FILE (.TXT, .TEXT, .MD)
            </label>
            <input
              id="image-batch-file"
              type="file"
              accept=".txt,.text,.md,text/plain,text/markdown"
              onChange={handleBatchFile}
              disabled={isGenerating}
              style={{ display: 'block', width: '100%', color: 'var(--secondary)', marginBottom: '0.75rem' }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Put one prompt on each actual line in the file. Blank lines are ignored. Text wrapping
              on screen does not split a prompt; only line breaks saved in the file do. Prompts run
              one at a time, in file order, with no fixed batch-count limit.
            </p>
            {batchFileName && (
              <div style={{ margin: '1rem 0', color: 'var(--secondary)' }}>
                <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                {batchFileName}: {batchPrompts.length} prompt{batchPrompts.length === 1 ? '' : 's'}
                {batchPrompts.length > 0 && (
                  <pre
                    style={{
                      maxHeight: '180px',
                      overflow: 'auto',
                      padding: '0.75rem',
                      marginTop: '0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      font: 'inherit',
                      fontSize: '0.85rem'
                    }}
                  >
                    {batchPrompts.slice(0, 3).map((item, index) => (
                      `${String(index + 1).padStart(3, '0')}. ${item}\n`
                    ))}
                    {batchPrompts.length > 3 && `...and ${batchPrompts.length - 3} more`}
                  </pre>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                className="btn-primary"
                type="button"
                onClick={handleGenerateBatch}
                disabled={batchPrompts.length === 0 || isGenerating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle size={17} className="spin" /> Generating {batchProgress.completed}/{batchProgress.total}
                  </>
                ) : (
                  <>
                    <ImageIcon size={17} /> Generate {batchPrompts.length || ''} Images
                  </>
                )}
              </button>
              {isGenerating && (
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => {
                    cancelBatchRef.current = true;
                    setServiceStatus('Will stop after the current image finishes...');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Square size={15} /> Stop after current
                </button>
              )}
              <button
                className="btn-secondary"
                type="button"
                onClick={handleDownloadBatch}
                disabled={generatedImages.length === 0 || isDownloading || isGenerating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isDownloading ? (
                  <>
                    <LoaderCircle size={16} className="spin" /> Creating ZIP...
                  </>
                ) : (
                  <>
                    <Archive size={16} /> Download All ({generatedImages.length}) ZIP
                  </>
                )}
              </button>
            </div>
            {batchProgress.total > 0 && (
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={batchProgress.total}
                aria-valuenow={batchProgress.completed}
                style={{
                  height: '7px',
                  marginTop: '1rem',
                  overflow: 'hidden',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.1)'
                }}
              >
                <div
                  style={{
                    width: `${(batchProgress.completed / batchProgress.total) * 100}%`,
                    height: '100%',
                    background: 'var(--accent)',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '8px',
              color: 'var(--danger)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)'
            }}
          >
            {error}
          </div>
        )}

        {isGenerating && (
          <div
            role="status"
            style={{
              minHeight: '180px',
              marginTop: '1.5rem',
              display: 'grid',
              placeContent: 'center',
              gap: '0.75rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <LoaderCircle size={32} className="spin" style={{ margin: '0 auto' }} />
            {serviceStatus || 'Creating your image. This can take a little while.'}
          </div>
        )}

        {generatedImages.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: mode === 'single' ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem'
            }}
          >
            {generatedImages.map((generatedImage, index) => (
              <div
                key={`${generatedImage.filename}-${index}`}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                <img
                  src={generatedImage.url}
                  alt={`Generated image ${index + 1}: ${generatedImage.prompt}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    maxHeight: '520px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: '#111'
                  }}
                />
                <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', overflowWrap: 'anywhere' }}>
                  {generatedImage.filename}
                </p>
                {mode === 'single' && (
                  <a
                    className="btn-secondary"
                    href={generatedImage.url}
                    download={generatedImage.filename}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Download size={16} /> Download image
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '1.5rem 0 0' }}>
          This uses Black Forest Labs&apos; public Hugging Face demo, so no account, API key, or
          payment setup is needed in this app. Prompts are sent to that third-party demo. It is
          shared infrastructure and may queue, limit, or stop accepting requests; no availability
          guarantee is provided. Batch processing runs sequentially and stops at the first failed
          image to avoid repeatedly calling a failing service. Large batches can take a long time
          and use substantial browser memory. Do not include sensitive information.
        </p>
      </div>
    </motion.div>
  );
};

export default AIImageGenerator;
