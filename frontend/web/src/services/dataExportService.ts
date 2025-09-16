// Data Export Service
export interface ExportOptions {
  format?: 'csv' | 'json' | 'xlsx';
  filename?: string;
  includeHeaders?: boolean;
}

export interface ExportData {
  headers: string[];
  rows: any[][];
  metadata?: {
    exportDate: string;
    totalRecords: number;
    filters?: any;
  };
}

class DataExportService {
  /**
   * Export data to CSV format
   */
  exportToCSV(data: ExportData, options: ExportOptions = { format: 'csv' }): void {
    const { headers, rows, metadata } = data;
    const { filename = 'export', includeHeaders = true } = options;
    
    let csvContent = '';
    
    // Add metadata if provided
    if (metadata) {
      csvContent += `# Export Date: ${metadata.exportDate}\n`;
      csvContent += `# Total Records: ${metadata.totalRecords}\n`;
      if (metadata.filters) {
        csvContent += `# Filters: ${JSON.stringify(metadata.filters)}\n`;
      }
      csvContent += '\n';
    }
    
    // Add headers
    if (includeHeaders) {
      csvContent += headers.join(',') + '\n';
    }
    
    // Add data rows
    (rows || []).forEach(row => {
      const escapedRow = row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csvContent += escapedRow.join(',') + '\n';
    });
    
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  /**
   * Export data to JSON format
   */
  exportToJSON(data: ExportData, options: ExportOptions = { format: 'json' }): void {
    const { headers, rows, metadata } = data;
    const { filename = 'export' } = options;
    
    const jsonData = {
      metadata: metadata || {
        exportDate: new Date().toISOString(),
        totalRecords: rows.length,
      },
      headers,
      data: rows.map(row => {
        const obj: any = {};
        (headers || []).forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      }),
    };
    
    const jsonContent = JSON.stringify(jsonData, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }

  /**
   * Export data to Excel format (XLSX)
   */
  exportToXLSX(data: ExportData, options: ExportOptions = { format: 'xlsx' }): void {
    const { headers, rows, metadata } = data;
    const { filename = 'export' } = options;
    
    // Create workbook and worksheet
    const workbook: any = {
      SheetNames: ['Data'],
      Sheets: {
        Data: {
          '!ref': `A1:${String.fromCharCode(65 + headers.length - 1)}${rows.length + 1}`,
          '!cols': headers.map(() => ({ wch: 15 })),
        }
      }
    };
    
    // Add headers
    (headers || []).forEach((header, index) => {
      const cellRef = `${String.fromCharCode(65 + index)}1`;
      workbook.Sheets.Data[cellRef] = { v: header, t: 's' };
    });
    
    // Add data rows
    (rows || []).forEach((row, rowIndex) => {
      (row || []).forEach((cell, colIndex) => {
        const cellRef = `${String.fromCharCode(65 + colIndex)}${rowIndex + 2}`;
        workbook.Sheets.Data[cellRef] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
      });
    });
    
    // For demo purposes, we'll export as CSV since XLSX requires additional libraries
    // In production, you would use a library like 'xlsx' or 'exceljs'
    this.exportToCSV(data, { ...options, filename: `${filename}_excel_format` });
  }

  /**
   * Export portfolio data
   */
  exportPortfolio(portfolio: any): void {
    const data: ExportData = {
      headers: ['Symbol', 'Quantity', 'Value', 'Change', 'Change %', 'Last Updated'],
      rows: portfolio?.positions?.map((pos: any) => [
        pos.symbol,
        pos.quantity,
        pos.value,
        pos.change,
        pos.changePercent,
        new Date(pos.lastUpdated).toLocaleString(),
      ]) || [],
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: portfolio?.positions?.length || 0,
        filters: { type: 'portfolio' },
      },
    };
    
    this.exportToCSV(data, { filename: 'portfolio_export' });
  }

  /**
   * Export trading history
   */
  exportTradingHistory(trades: any[]): void {
    const data: ExportData = {
      headers: ['Date', 'Symbol', 'Type', 'Side', 'Quantity', 'Price', 'Amount', 'Status'],
      rows: trades.map(trade => [
        new Date(trade.timestamp).toLocaleString(),
        trade.symbol,
        trade.type,
        trade.side,
        trade.quantity,
        trade.price,
        trade.amount,
        trade.status,
      ]),
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: trades.length,
        filters: { type: 'trading_history' },
      },
    };
    
    this.exportToCSV(data, { filename: 'trading_history' });
  }

  /**
   * Export market data
   */
  exportMarketData(marketData: any[], symbol: string): void {
    const data: ExportData = {
      headers: ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume'],
      rows: marketData.map(candle => [
        new Date(candle.timestamp).toLocaleString(),
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume,
      ]),
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: marketData.length,
        filters: { symbol, type: 'market_data' },
      },
    };
    
    this.exportToCSV(data, { filename: `market_data_${symbol}` });
  }

  /**
   * Export alerts data
   */
  exportAlerts(alerts: any[]): void {
    const data: ExportData = {
      headers: ['Name', 'Type', 'Symbol', 'Condition', 'Value', 'Status', 'Channels', 'Last Triggered'],
      rows: alerts.map(alert => [
        alert.name,
        alert.type,
        alert.symbol || 'N/A',
        alert.condition,
        alert.value,
        alert.status,
        alert.channels?.join(', ') || 'N/A',
        alert.lastTriggered ? new Date(alert.lastTriggered).toLocaleString() : 'Never',
      ]),
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: alerts.length,
        filters: { type: 'alerts' },
      },
    };
    
    this.exportToCSV(data, { filename: 'alerts_export' });
  }

  /**
   * Download file to user's device
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get available export formats
   */
  getAvailableFormats(): string[] {
    return ['csv', 'json', 'xlsx'];
  }

  /**
   * Validate export data
   */
  validateExportData(data: ExportData): boolean {
    if (!data.headers || !Array.isArray(data.headers)) {
      console.error('Invalid headers in export data');
      return false;
    }
    
    if (!data.rows || !Array.isArray(data.rows)) {
      console.error('Invalid rows in export data');
      return false;
    }
    
    // Check if all rows have the same number of columns as headers
    const headerCount = data.headers.length;
    const invalidRows = data.rows.filter(row => !Array.isArray(row) || row.length !== headerCount);
    
    if (invalidRows.length > 0) {
      console.error(`Found ${invalidRows.length} rows with invalid column count`);
      return false;
    }
    
    return true;
  }
}

export const dataExportService = new DataExportService();
export default dataExportService;
