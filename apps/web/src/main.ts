import DOMPurify from 'dompurify';
import { convertClipboardData } from '@paste-to-markdown/core';

const sourceEl = document.getElementById('source') as HTMLDivElement;
const outputEl = document.getElementById('output') as HTMLTextAreaElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

function sanitizeAndSetHtml(container: HTMLElement, html: string): void {
  container.innerHTML = DOMPurify.sanitize(html);
}

let statusTimeout: ReturnType<typeof setTimeout> | undefined;

function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  clearTimeout(statusTimeout);
  statusEl.textContent = message;
  statusEl.className = `status status-${type}`;
  statusTimeout = setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 2500);
}

function handlePaste(event: ClipboardEvent): void {
  event.preventDefault();

  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    showStatus('No clipboard data available.', 'error');
    return;
  }

  const markdown = convertClipboardData(clipboardData);

  if (!markdown) {
    showStatus('Nothing to convert — paste some rich text.', 'info');
    return;
  }

  const html = clipboardData.getData('text/html');
  if (html) {
    sanitizeAndSetHtml(sourceEl, html);
  } else {
    sourceEl.textContent = clipboardData.getData('text/plain');
  }

  outputEl.value = markdown;
  showStatus('Converted!', 'success');
}

function handleClear(): void {
  sourceEl.innerHTML = '';
  outputEl.value = '';
  showStatus('Cleared.', 'info');
}

async function handleCopy(): Promise<void> {
  const text = outputEl.value;
  if (!text) {
    showStatus('Nothing to copy.', 'info');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showStatus('Copied to clipboard!', 'success');
  } catch {
    outputEl.select();
    document.execCommand('copy');
    showStatus('Copied!', 'success');
  }
}

document.addEventListener('paste', handlePaste);
clearBtn.addEventListener('click', handleClear);
copyBtn.addEventListener('click', handleCopy);

sourceEl.focus();
