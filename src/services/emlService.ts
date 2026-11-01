import { Page, Block } from '../types';
import { exportPageMarkdown, parseMarkdownToBlocks } from './storage';
import { getMediaItem, storeMediaItem, StoredMedia } from './mediaStore';
import { nanoid } from 'nanoid';

/**
 * RFC 5322 MIME & CapsuleCraft .eml Export & Import Engine
 */

export async function exportPageToEML(page: Page): Promise<string> {
  const boundary = `----=_Nota_Boundary_${nanoid(16)}`;
  const dateStr = new Date(page.createdAt || Date.now()).toUTCString();
  const subject = page.title || 'Untitled Note';
  const icon = page.icon || '📄';
  const tagsStr = (page.tags || []).join(', ');

  // Collect media attachments from blocks
  const mediaParts: {
    mimeType: string;
    filename: string;
    cid: string;
    base64Data: string;
  }[] = [];

  let markdownContent = exportPageMarkdown(page);

  for (const block of page.blocks) {
    // Process image block
    if (block.type === 'image' && block.imageUrl) {
      let dataUrl = block.imageUrl;
      let mimeType = 'image/png';
      let base64 = '';

      if (dataUrl.startsWith('media://')) {
        const mediaId = dataUrl.replace('media://', '');
        const item = await getMediaItem(mediaId);
        if (item) {
          dataUrl = item.dataUrl;
          mimeType = item.mimeType || 'image/png';
        }
      }

      if (dataUrl.startsWith('data:')) {
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64 = match[2];
        }
      }

      if (base64) {
        const cid = `img_${block.id}@nota.local`;
        const ext = mimeType.split('/')[1] || 'png';
        mediaParts.push({
          mimeType,
          filename: `attachment_${block.id}.${ext}`,
          cid,
          base64Data: base64,
        });
      }
    }

    // Process audio / voice memo block
    if (block.type === 'audio' && block.audioUrl) {
      let dataUrl = block.audioUrl;
      let mimeType = 'audio/webm';
      let base64 = '';

      if (dataUrl.startsWith('media://')) {
        const mediaId = dataUrl.replace('media://', '');
        const item = await getMediaItem(mediaId);
        if (item) {
          dataUrl = item.dataUrl;
          mimeType = item.mimeType || 'audio/webm';
        }
      }

      if (dataUrl.startsWith('data:')) {
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64 = match[2];
        }
      }

      if (base64) {
        const cid = `audio_${block.id}@nota.local`;
        const ext = mimeType.split('/')[1] || 'webm';
        mediaParts.push({
          mimeType,
          filename: `voice_${block.id}.${ext}`,
          cid,
          base64Data: base64,
        });
      }
    }
  }

  // Construct MIME Headers
  let eml = `From: Nota Workspace <user@nota.local>\r\n`;
  eml += `Subject: ${icon} ${subject}\r\n`;
  eml += `Date: ${dateStr}\r\n`;
  eml += `Message-ID: <${page.id}@nota.local>\r\n`;
  eml += `MIME-Version: 1.0\r\n`;
  eml += `X-Nota-Version: 1.1.0\r\n`;
  eml += `X-Nota-Icon: ${icon}\r\n`;
  eml += `X-Nota-Page-Id: ${page.id}\r\n`;
  if (tagsStr) eml += `X-Nota-Tags: ${tagsStr}\r\n`;
  eml += `Content-Type: multipart/related; boundary="${boundary}"\r\n\r\n`;

  // Body Part (text/markdown)
  eml += `--${boundary}\r\n`;
  eml += `Content-Type: text/markdown; charset=utf-8\r\n`;
  eml += `Content-Transfer-Encoding: 8bit\r\n\r\n`;
  eml += `${markdownContent}\r\n\r\n`;

  // Media Attachment Parts
  for (const part of mediaParts) {
    eml += `--${boundary}\r\n`;
    eml += `Content-Type: ${part.mimeType}\r\n`;
    eml += `Content-Transfer-Encoding: base64\r\n`;
    eml += `Content-ID: <${part.cid}>\r\n`;
    eml += `Content-Disposition: inline; filename="${part.filename}"\r\n\r\n`;
    // Split base64 into 76-character lines for standard RFC compliance
    const wrappedBase64 = part.base64Data.match(/.{1,76}/g)?.join('\r\n') || part.base64Data;
    eml += `${wrappedBase64}\r\n\r\n`;
  }

  eml += `--${boundary}--\r\n`;
  return eml;
}

/**
 * Trigger file download of .eml capsule
 */
export async function downloadPageAsEML(page: Page): Promise<void> {
  const emlContent = await exportPageToEML(page);
  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = (page.title || 'untitled').replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_');
  a.href = url;
  a.download = `${safeTitle}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse an RFC 5322 / CapsuleCraft .eml file into a Nota Page
 */
export async function parseEMLToPage(rawEml: string, fallbackTitle: string = 'Imported Capsule'): Promise<Page> {
  // Normalize line breaks
  const normalized = rawEml.replace(/\r\n/g, '\n');
  const headerEndIndex = normalized.indexOf('\n\n');
  const headerSection = headerEndIndex !== -1 ? normalized.slice(0, headerEndIndex) : normalized;
  const bodySection = headerEndIndex !== -1 ? normalized.slice(headerEndIndex + 2) : '';

  // Parse Headers
  const headers: Record<string, string> = {};
  const headerLines = headerSection.split('\n');
  let currentKey = '';

  for (const line of headerLines) {
    if (/^\s/.test(line) && currentKey) {
      // Continuation line (folding)
      headers[currentKey] += ' ' + line.trim();
    } else {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        currentKey = match[1].toLowerCase();
        headers[currentKey] = match[2].trim();
      }
    }
  }

  // Extract Subject & Emoji
  let title = fallbackTitle;
  let icon = '📄';
  if (headers['subject']) {
    title = headers['subject'];
    const emojiMatch = title.match(/^(\p{Extended_Pictographic}|\p{Emoji})\s*(.*)$/u);
    if (emojiMatch) {
      icon = emojiMatch[1];
      title = emojiMatch[2] || title;
    }
  }

  if (headers['x-nota-icon']) {
    icon = headers['x-nota-icon'];
  }

  const tags: string[] = [];
  if (headers['x-nota-tags']) {
    headers['x-nota-tags'].split(',').forEach((t) => {
      const clean = t.trim();
      if (clean) tags.push(clean.startsWith('#') ? clean : `#${clean}`);
    });
  }

  let createdAt = Date.now();
  if (headers['date']) {
    const parsedDate = Date.parse(headers['date']);
    if (!isNaN(parsedDate)) createdAt = parsedDate;
  }

  // Parse Body (Check for multipart boundary)
  let markdownBody = '';
  const contentType = headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=["']?([^"';]+)["']?/i);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = bodySection.split(`--${boundary}`);

    for (const part of parts) {
      if (part.trim() === '--' || !part.trim()) continue;
      const partEndHeader = part.indexOf('\n\n');
      if (partEndHeader === -1) continue;

      const partHeadersRaw = part.slice(0, partEndHeader);
      const partBody = part.slice(partEndHeader + 2).trim();

      const partContentType = (partHeadersRaw.match(/content-type:\s*([^;\n]+)/i)?.[1] || '').toLowerCase();
      const isBase64 = /content-transfer-encoding:\s*base64/i.test(partHeadersRaw);
      const contentId = (partHeadersRaw.match(/content-id:\s*<([^>]+)>/i)?.[1] || '').trim();

      if (partContentType.includes('text/markdown') || partContentType.includes('text/plain')) {
        markdownBody += (isBase64 ? atob(partBody.replace(/\s+/g, '')) : partBody) + '\n\n';
      } else if (partContentType.includes('text/html') && !markdownBody) {
        // Strip basic HTML if no markdown body was found
        const clean = partBody.replace(/<[^>]*>/g, ' ');
        markdownBody = clean;
      } else if (isBase64 && (partContentType.startsWith('image/') || partContentType.startsWith('audio/'))) {
        // Store attachment in IndexedDB
        const cleanBase64 = partBody.replace(/\s+/g, '');
        const dataUrl = `data:${partContentType};base64,${cleanBase64}`;
        const mediaId = 'media-' + nanoid(8);
        const isAudio = partContentType.startsWith('audio/');

        const storedMedia: StoredMedia = {
          id: mediaId,
          type: isAudio ? 'audio' : 'image',
          dataUrl,
          name: contentId || `attachment_${mediaId}`,
          size: Math.round((cleanBase64.length * 3) / 4),
          mimeType: partContentType,
          createdAt: Date.now(),
        };

        await storeMediaItem(storedMedia);

        // Append block for the attachment
        if (isAudio) {
          markdownBody += `\n\n[audio:media://${mediaId}]\n\n`;
        } else {
          markdownBody += `\n\n![embedded](media://${mediaId})\n\n`;
        }
      }
    }
  } else {
    // Single-part body
    markdownBody = bodySection;
  }

  // Parse blocks
  const parsed = parseMarkdownToBlocks(markdownBody || 'Empty note', title);

  const newPage: Page = {
    id: 'page-' + nanoid(8),
    parentId: null,
    title: parsed.title || title,
    icon,
    cover: null,
    isFavorite: false,
    isArchived: false,
    createdAt,
    updatedAt: Date.now(),
    font: 'sans',
    fullWidth: false,
    smallText: false,
    tags: tags.length > 0 ? tags : undefined,
    blocks: parsed.blocks,
  };

  return newPage;
}
