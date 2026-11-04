import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Download, FileText, Image as ImageIcon, LoaderCircle, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import ToolHeader from '../../components/ToolHeader';
import {
  fetchAvailableImageModels,
  getImageDimensions,
  generateHordeImage,
  generateCloudflareImage,
  generatePollinationsImage
} from '../../utils/aiHorde';
import { createImageFilename, parseImagePrompts } from '../../utils/imageBatch';

const MAX_PROMPT_LENGTH = 1000;
const POLLINATIONS_INTERVAL_MS = 45000;

function getGenerationStatus(status, stopRequested = false) {
  if (status.phase === 'retrieving') return 'Image complete. Downloading the result...';
  if (status.phase === 'retrying') {
    return `Temporary provider limit or connection issue. Retry ${status.attempt}/${status.maxAttempts} in ${status.waitSeconds}s.`;
  }

  const queue = Number.isFinite(status.queuePosition) && status.queuePosition > 0
    ? ` Approximate overall queue position: ${status.queuePosition}.`
    : '';
  const wait = Number.isFinite(status.waitSeconds) && status.waitSeconds > 0
    ? ` Horde-wide estimate: about ${Math.ceil(status.waitSeconds / 60)} min.`
    : '';
  const prefix = stopRequested ? 'Will stop after this image. ' : '';
  const workerStatus = status.processing > 0
    ? 'A volunteer GPU worker is generating your image.'
    : 'Waiting for a volunteer GPU worker.';

  return `${prefix}${workerStatus}${queue}${wait}`;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'The free image service failed. Please try again later.';
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
  const [selectedProvider, setSelectedProvider] = useState('aihorde');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('hd');
  const [prompt, setPrompt] = useState('');
  const [batchFileName, setBatchFileName] = useState('');
  const [batchPromptText, setBatchPromptText] = useState('');
  const [imageModels, setImageModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelCatalogError, setModelCatalogError] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [batchFailure, setBatchFailure] = useState(null);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [serviceStatus, setServiceStatus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const imageUrlsRef = useRef([]);
  const cancelBatchRef = useRef(false);
  const lastPollinationsRequestRef = useRef(0);
  const batchPrompts = useMemo(() => parseImagePrompts(batchPromptText), [batchPromptText]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAvailableImageModels({ signal: controller.signal })
      .then(setImageModels)
      .catch((modelError) => {
        if (modelError.name !== 'AbortError') {
          setModelCatalogError(getErrorMessage(modelError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingModels(false);
      });

    return () => {
      controller.abort();
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const clearGeneratedImages = () => {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current = [];
    setGeneratedImages([]);
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

  const generateWithSelectedProvider = async (imagePrompt, onStatus, shouldStop = () => false) => {
    if (selectedProvider === 'pollinations') {
      const remaining = lastPollinationsRequestRef.current + POLLINATIONS_INTERVAL_MS - Date.now();
      if (remaining > 0) {
        const deadline = Date.now() + remaining;
        while (Date.now() < deadline) {
          if (shouldStop()) return null;
          const secondsLeft = Math.ceil((deadline - Date.now()) / 1000);
          onStatus(`Pollinations free tier: waiting ${secondsLeft}s before the next request (45-second per-IP limit).`);
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
        }
      }

      lastPollinationsRequestRef.current = Date.now();
      onStatus('Generating with Pollinations Classic...');
      return generatePollinationsImage(imagePrompt, {
        aspectRatio,
        resolution,
        onStatus,
        shouldStop
      });
    }

    if (selectedProvider === 'cloudflare') {
      return generateCloudflareImage(imagePrompt, {
        aspectRatio,
        resolution,
        onStatus,
        shouldStop
      });
    }

    return generateHordeImage(imagePrompt, { model: selectedModel, aspectRatio, resolution, onStatus });
  };

  const handleGenerateSingle = async (event) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isGenerating) return;

    clearGeneratedImages();
    setIsGenerating(true);
    setError('');
    setBatchFailure(null);
    setServiceStatus(
      selectedProvider === 'pollinations'
        ? 'Generating with Pollinations Classic...'
        : selectedProvider === 'cloudflare'
          ? 'Submitting to Cloudflare Workers AI...'
          : 'Submitting to the AI Horde community queue...'
    );

    try {
      const blob = await generateWithSelectedProvider(
        trimmedPrompt,
        (status) => setServiceStatus(typeof status === 'string' ? status : getGenerationStatus(status))
      );
      if (blob) setGeneratedImages([saveGeneratedImage(blob, trimmedPrompt, 1, 1)]);
      setServiceStatus('');
    } catch (generationError) {
      setError(getErrorMessage(generationError));
      setServiceStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBatchFileName(file.name);
    setError('');
    setBatchFailure(null);
    clearGeneratedImages();

    try {
      const text = await file.text();
      const prompts = parseImagePrompts(text);
      if (prompts.length === 0) {
        throw new Error('This file does not contain any prompts. Put one prompt on each non-empty line.');
      }
      setBatchPromptText(text);
      setBatchProgress({ completed: 0, total: prompts.length });
    } catch (fileError) {
      setError(getErrorMessage(fileError));
      setBatchFileName('');
      setBatchPromptText('');
      setBatchProgress({ completed: 0, total: 0 });
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

    let completedCount = 0;
    try {
      for (let index = 0; index < batchPrompts.length; index += 1) {
        if (cancelBatchRef.current) break;

        const currentNumber = index + 1;
        const currentPrompt = batchPrompts[index];
        setServiceStatus(selectedProvider === 'cloudflare'
          ? `Submitting image ${currentNumber} of ${batchPrompts.length} to Cloudflare Workers AI...`
          : `Submitting image ${currentNumber} of ${batchPrompts.length} to volunteer workers...`);

        try {
          const blob = await generateWithSelectedProvider(
            currentPrompt,
            (status) => setServiceStatus(typeof status === 'string'
              ? `Image ${currentNumber} of ${batchPrompts.length}: ${status}`
              : `Image ${currentNumber} of ${batchPrompts.length}: ${getGenerationStatus(status, cancelBatchRef.current)}`),
            () => cancelBatchRef.current
          );
          if (!blob) break;
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
        subtitle="Generate images with free community and hosted models"
      />

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'end',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div
            role="tablist"
            aria-label="Image generation mode"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}
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
          <label style={{ flex: '1 1 240px', maxWidth: '360px' }}>
            <span style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              IMAGE PROVIDER
            </span>
            <select
              className="input-glass"
              aria-label="Image provider"
              value={selectedProvider}
              onChange={(event) => setSelectedProvider(event.target.value)}
              disabled={isGenerating}
              style={{ width: '100%', minHeight: '44px' }}
            >
              <option value="aihorde">AI Horde - volunteer GPUs</option>
              <option value="pollinations">Pollinations Classic - fast, rate-limited</option>
              <option value="cloudflare">Cloudflare Workers AI - SDXL (setup required)</option>
            </select>
            <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              AI Horde and Pollinations need no setup; Cloudflare uses the site's server-side account.
            </span>
          </label>
          <label style={{ flex: '1 1 240px', maxWidth: '360px' }}>
            <span style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {selectedProvider === 'aihorde' ? 'FREE GENERATION MODEL' : 'GENERATION MODEL'}
            </span>
            <select
              className="input-glass"
              aria-label="Generation model"
              value={selectedProvider === 'aihorde'
                ? selectedModel
                : selectedProvider === 'pollinations' ? 'pollinations-classic' : 'cloudflare-sdxl'}
              onChange={(event) => setSelectedModel(event.target.value)}
              disabled={isGenerating || (selectedProvider === 'aihorde' ? isLoadingModels : true)}
              style={{ width: '100%', minHeight: '44px' }}
            >
              {selectedProvider === 'aihorde' ? (
                <option value="">
                {isLoadingModels ? 'Loading available models...' : 'Auto - any available model'}
                </option>
              ) : selectedProvider === 'pollinations' ? (
                <option value="pollinations-classic">Pollinations Classic (fixed model)</option>
              ) : (
                <option value="cloudflare-sdxl">Stable Diffusion XL Base (Cloudflare)</option>
              )}
              {selectedProvider === 'aihorde' && imageModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({model.count} {model.count === 1 ? 'worker' : 'workers'})
                </option>
              ))}
            </select>
            <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {selectedProvider === 'aihorde'
                ? 'Free community models with active workers; availability changes.'
                : selectedProvider === 'pollinations'
                  ? 'Single free model; Pollinations adds a small logo to images.'
                  : 'Requires Cloudflare Vercel environment variables; the provider token stays on the server.'}
            </span>
          </label>
          <label style={{ flex: '1 1 160px', maxWidth: '240px' }}>
            <span style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              ASPECT RATIO
            </span>
            <select
              className="input-glass"
              aria-label="Image aspect ratio"
              value={aspectRatio}
              onChange={(event) => setAspectRatio(event.target.value)}
              disabled={isGenerating}
              style={{ width: '100%', minHeight: '44px' }}
            >
              <option value="1:1">1:1 - Square</option>
              <option value="16:9">16:9 - Landscape</option>
              <option value="9:16">9:16 - Portrait</option>
              <option value="4:3">4:3 - Classic landscape</option>
              <option value="3:4">3:4 - Classic portrait</option>
            </select>
            <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {(() => {
                const { width, height } = getImageDimensions(aspectRatio, selectedProvider, resolution);
                return `${width} × ${height} output`;
              })()}
            </span>
          </label>
          <label style={{ flex: '1 1 160px', maxWidth: '240px' }}>
            <span style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              RESOLUTION
            </span>
            <select
              className="input-glass"
              aria-label="Image resolution"
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              disabled={isGenerating}
              style={{ width: '100%', minHeight: '44px' }}
            >
              <option value="standard">Standard</option>
              <option value="hd">HD (provider maximum)</option>
            </select>
            <span style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {selectedProvider === 'pollinations'
                ? 'Pollinations Classic is capped at 768px per side.'
                : 'HD can use up to 1024px per side; model/worker support varies.'}
            </span>
          </label>
        </div>
        {selectedProvider === 'aihorde' && modelCatalogError && (
          <p role="status" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '-0.5rem' }}>
            Could not load the live model list: {modelCatalogError} Automatic model selection is still available.
          </p>
        )}

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
              htmlFor="image-batch-text"
              style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}
            >
              PROMPTS (PASTE OR TYPE, ONE PROMPT PER LINE)
            </label>
            <textarea
              id="image-batch-text"
              className="textarea-glass"
              value={batchPromptText}
              onChange={(event) => {
                const text = event.target.value;
                const prompts = parseImagePrompts(text);
                setBatchPromptText(text);
                setBatchFileName('');
                setBatchProgress({ completed: 0, total: prompts.length });
                setError('');
                setBatchFailure(null);
                clearGeneratedImages();
              }}
              placeholder={'A tiny blue bird on a branch\nA red apple on a wooden table'}
              disabled={isGenerating}
              style={{ minHeight: '150px', resize: 'vertical', marginBottom: '0.75rem' }}
            />
            <label
              htmlFor="image-batch-file"
              style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}
            >
              OR UPLOAD PROMPTS (.TXT, .TEXT, .MD)
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
              Paste text directly or upload a file. Each actual line is one prompt; blank lines are
              ignored, and visual wrapping does not split prompts. They run one at a time in order.
            </p>
            {(batchFileName || batchPromptText) && (
              <div style={{ margin: '1rem 0', color: 'var(--secondary)' }}>
                <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                {batchFileName ? `${batchFileName}: ` : 'Pasted text: '}
                {batchPrompts.length} prompt{batchPrompts.length === 1 ? '' : 's'}
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
          AI Horde uses a community-run volunteer GPU network; anonymous requests have lower queue
          priority and are shared with LAION. Pollinations Classic is usually faster but allows only
          one free image request per IP every 45 seconds and adds its logo. Both are best-effort
          services, and prompts are sent to the selected provider; do not include sensitive
          information. Batch jobs run sequentially and stop on provider errors. Pollinations batches
          automatically wait between requests; large batches may still take time and use substantial
          browser memory.
        </p>
      </div>
    </motion.div>
  );
};

export default AIImageGenerator;
