/**
 * PDF Export Utilities
 * 
 * Functions for generating PDF reports of orders with product images and structured layout.
 */

import { OrderSummary } from "./auth";
import { parseOrderNumber } from "@/utils/orderNumber";

interface PDFExportOptions {
  orders: OrderSummary[];
  includeImages?: boolean;
  includeTechnicalDetails?: boolean;
  filename?: string;
}

/**
 * Generate PDF export of orders
 */
export async function exportOrdersToPDF(options: PDFExportOptions): Promise<void> {
  const {
    orders,
    includeImages = true,
    includeTechnicalDetails = true,
    filename = `ordrer-export-${new Date().toISOString().split('T')[0]}.pdf`
  } = options;

  try {
    // This would typically use a library like jsPDF or send data to a backend service
    // For now, we'll create a structured HTML that can be printed to PDF
    
    const htmlContent = generateOrdersHTML(orders, { includeImages, includeTechnicalDetails });
    
    // Create a new window with the content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for images to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      };
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Kunne ikke generere PDF');
  }
}

/**
 * Generate HTML content for orders
 */
function generateOrdersHTML(
  orders: OrderSummary[], 
  options: { includeImages: boolean; includeTechnicalDetails: boolean }
): string {
  const { includeImages, includeTechnicalDetails } = options;
  
  const orderRows = orders.map(order => {
    const parsed = parseOrderNumber(order.orderNumber);
    
    return `
      <tr class="order-row">
        <td class="order-number">
          <div class="sequence-number">#${parsed.sequenceNumber}</div>
          ${includeTechnicalDetails ? `
            <div class="technical-number">${order.orderNumber}</div>
          ` : ''}
        </td>
        <td class="customer-info">
          <div class="company-name">${order.customer.companyName}</div>
          <div class="contact-person">${order.customer.contactPersonName}</div>
          <div class="email">${order.customer.email}</div>
        </td>
        <td class="order-date">
          <div class="formatted-date">${parsed.formattedDate}</div>
          <div class="formatted-time">${parsed.formattedTime}</div>
        </td>
        <td class="status">
          <div class="status-badge status-${order.status}">
            ${getStatusLabel(order.status)}
          </div>
        </td>
        <td class="amount">
          <div class="total-amount">${order.totalAmount.toLocaleString('da-DK')} kr</div>
        </td>
        ${includeImages ? `
          <td class="product-images">
            <div class="image-grid">
              ${generateProductImagesPlaceholder(order)}
            </div>
          </td>
        ` : ''}
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="da">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Multi Grønt - Ordre Export</title>
      <style>
        ${getPDFStyles(includeImages)}
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <header class="pdf-header">
          <div class="logo-section">
            <h1>Multi Grønt</h1>
            <p>Ordre Export</p>
          </div>
          <div class="export-info">
            <p>Genereret: ${new Date().toLocaleDateString('da-DK', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p>Antal ordrer: ${orders.length}</p>
          </div>
        </header>

        <main class="pdf-content">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Ordrenummer</th>
                <th>Kunde</th>
                <th>Dato</th>
                <th>Status</th>
                <th>Beløb</th>
                ${includeImages ? '<th>Produkter</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${orderRows}
            </tbody>
          </table>
        </main>

        <footer class="pdf-footer">
          <p>Multi Grønt ApS | Ordrer Export | Side 1 af 1</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get status label for display
 */
function getStatusLabel(status: string): string {
  const labels = {
    order_placed: 'Afgivet',
    order_confirmed: 'Bekræftet',
    in_transit: 'Pakket',
    delivered: 'Leveret',
    invoiced: 'Faktureret'
  };
  return labels[status as keyof typeof labels] || status;
}

/**
 * Generate product images placeholder (would be replaced with actual images)
 */
function generateProductImagesPlaceholder(order: OrderSummary): string {
  // This would typically fetch actual product images
  // For now, generate placeholders based on order items
  const placeholderCount = Math.min(3, Math.ceil(order.totalAmount / 1000)); // Simulate item count
  
  return Array(placeholderCount).fill(0).map((_, index) => `
    <div class="product-image-placeholder">
      <div class="placeholder-icon">📦</div>
      <div class="placeholder-text">Produkt ${index + 1}</div>
    </div>
  `).join('');
}

/**
 * Generate CSS styles for PDF
 */
function getPDFStyles(includeImages: boolean): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      background: white;
    }

    .pdf-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }

    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #2D7D32;
    }

    .logo-section h1 {
      font-size: 24px;
      color: #2D7D32;
      margin-bottom: 5px;
    }

    .logo-section p {
      color: #666;
      font-size: 14px;
    }

    .export-info {
      text-align: right;
      color: #666;
      font-size: 11px;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .orders-table th {
      background: #f5f5f5;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .orders-table td {
      padding: 15px 8px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }

    .order-row:hover {
      background: #f9f9f9;
    }

    .sequence-number {
      font-weight: 600;
      color: #2D7D32;
      font-size: 14px;
      margin-bottom: 3px;
    }

    .technical-number {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      color: #666;
      word-break: break-all;
    }

    .company-name {
      font-weight: 600;
      margin-bottom: 3px;
    }

    .contact-person {
      color: #666;
      font-size: 11px;
      margin-bottom: 2px;
    }

    .email {
      color: #666;
      font-size: 10px;
    }

    .formatted-date {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .formatted-time {
      color: #666;
      font-size: 11px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-order_placed {
      background: #f3f4f6;
      color: #374151;
    }

    .status-order_confirmed {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .status-in_transit {
      background: #fef3c7;
      color: #d97706;
    }

    .status-delivered {
      background: #d1fae5;
      color: #065f46;
    }

    .status-invoiced {
      background: #dcfce7;
      color: #16a34a;
    }

    .total-amount {
      font-weight: 600;
      font-size: 14px;
      color: #2D7D32;
    }

    ${includeImages ? `
      .image-grid {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }

      .product-image-placeholder {
        width: 40px;
        height: 40px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .placeholder-icon {
        font-size: 16px;
        margin-bottom: 2px;
      }

      .placeholder-text {
        font-size: 8px;
        color: #666;
      }
    ` : ''}

    .pdf-footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 10px;
    }

    @media print {
      body {
        print-color-adjust: exact;
      }
      
      .pdf-container {
        margin: 0;
        padding: 15mm;
      }
      
      .orders-table {
        page-break-inside: avoid;
      }
      
      .order-row {
        page-break-inside: avoid;
      }
    }
  `;
} 