import { useCallback } from 'react';

/**
 * useHiddenIframePrint
 *
 * "Hidden Iframe Dynamic Print" architectural pattern.
 * Instead of using fragile `@media print` CSS overrides that can produce
 * blank pages when hidden inside modals/dialogs, this hook creates a
 * completely isolated browsing context via a hidden <iframe>.
 *
 * The print pipeline:
 * 1. Extract the innerHTML of the receipt container element.
 * 2. Construct a standalone HTML document with:
 *    - Inline CSS (80mm thermal receipt styles)
 *    - The extracted receipt markup
 * 3. Write the document into a hidden iframe's contentWindow.
 * 4. Call contentWindow.print() — the browser prints ONLY the iframe
 *    content with zero layout leakage from the parent dashboard.
 * 5. Clean up: remove the iframe after a short delay.
 *
 * Benefits:
 * - Zero layout leaking: parent modal, overlay, sidebar never interfere.
 * - WYSIWYG accuracy: printed output matches the preview exactly.
 * - No global CSS conflicts: the iframe is a clean document context.
 */
export function useHiddenIframePrint() {
  const printViaHiddenIframe = useCallback(
    (receiptElement: HTMLElement | null): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          if (!receiptElement) {
            reject(new Error('Receipt element ref is null'));
            return;
          }

          // ── 1. Extract receipt HTML ──
          const receiptHTML = receiptElement.innerHTML;

          // ── 2. Build a standalone document with thermal-receipt styling ──
          const printDocument = buildPrintDocument(receiptHTML);

          // ── 3. Create hidden iframe ──
          const iframe = document.createElement('iframe');
          iframe.setAttribute(
            'style',
            'position:fixed; top:-9999px; left:-9999px; width:0; height:0; border:none; opacity:0; pointer-events:none;'
          );
          iframe.setAttribute('title', 'thermal-receipt-print-frame');
          iframe.setAttribute('aria-hidden', 'true');

          // Append to body so the iframe has a document context
          document.body.appendChild(iframe);

          // ── 4. Write the print document into the iframe ──
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            document.body.removeChild(iframe);
            reject(new Error('Could not access iframe document'));
            return;
          }

          iframeDoc.open();
          iframeDoc.write(printDocument);
          iframeDoc.close();

          // ── 5. Wait for images/fonts to load, then print ──
          const handlePrint = () => {
            try {
              // Focus the iframe window to ensure print dialog targets it
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();

              // Clean up after a short delay (print is non-blocking)
              setTimeout(() => {
                try {
                  if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                  }
                } catch (cleanupErr) {
                  // Silently ignore cleanup errors
                }
                resolve();
              }, 500);
            } catch (printErr) {
              // Clean up on error
              try {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
              } catch (e) {
                // ignore
              }
              reject(printErr);
            }
          };

          // If the iframe document is already loaded, print immediately
          if (
            iframeDoc.readyState === 'complete' ||
            iframeDoc.readyState === 'interactive'
          ) {
            handlePrint();
          } else {
            // Wait for load
            iframe.onload = handlePrint;
          }
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );

  return { printViaHiddenIframe };
}

/**
 * Builds a standalone HTML document string for the 80mm thermal receipt.
 * Includes all required styles, page sizing, and print-color-adjust flags.
 */
function buildPrintDocument(receiptHTML: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=80mm" />
  <title>Thermal Receipt</title>
  <style>
    /* ── Page setup for 80mm thermal roll ── */
    @page {
      size: 80mm auto;
      margin: 0;
    }

    /* ── Force exact color reproduction ── */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      width: 80mm;
      min-height: auto;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #000;
      line-height: 1.3;
      -webkit-font-smoothing: antialiased;
    }

    body {
      padding: 2px;
    }

    /* ── Receipt container ── */
    .receipt-print-root {
      width: 76mm;
      max-width: 100%;
      margin: 0 auto;
      background: #ffffff;
    }

    /* ── Force black text, allow exceptions ── */
    .receipt-print-root,
    .receipt-print-root * {
      color: #000 !important;
    }

    .total-box,
    .total-box * {
      color: #fff !important;
      background: #000 !important;
    }

    .status-badge-pending,
    .status-badge-pending * {
      color: #000 !important;
      background: #fff !important;
    }

    .status-badge-paid,
    .status-badge-paid * {
      color: #fff !important;
      background: #000 !important;
    }

    .strikethrough-price {
      color: #777 !important;
      text-decoration: line-through !important;
    }

    .discounted-price {
      color: #000 !important;
      font-weight: 600 !important;
    }

    /* ── Monospace numeric alignment ── */
    .mono-nums {
      font-family: 'Courier New', 'Consolas', monospace;
    }

    /* ── Ensure no page breaks inside items ── */
    .receipt-item {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* ── SVG / Logo rendering ── */
    svg {
      shape-rendering: geometricPrecision;
    }

    /* ── Suppress any external link decoration in print ── */
    a {
      text-decoration: none;
      color: inherit;
    }

    /* ── Ensure no extra padding/margins from parent influences ── */
    :root {
      --print-safe: 0;
    }
  </style>
</head>
<body>
  <div class="receipt-print-root">
    ${receiptHTML}
  </div>
</body>
</html>`;
}