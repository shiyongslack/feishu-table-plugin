import * as XLSX from 'xlsx-js-style';

declare global {
  interface Window {
    LarkBase: any;
  }
}

export interface ExportFieldInfo {
  id: string;
  name: string;
  type: number;
  isAttachment: boolean;
}

export interface ExportRecord {
  recordId: string;
  values: Record<string, unknown>;
  attachmentUrls: Record<string, string[]>;
}

export interface ExportPreview {
  fields: ExportFieldInfo[];
  recordCount: number;
  attachmentFields: string[];
}

export interface ExportConfig {
  mergeAdjacentCells: boolean;
  embedImages: boolean;
}

export interface ViewExportData {
  viewName: string;
  fields: ExportFieldInfo[];
  records: ExportRecord[];
}

const ATTACHMENT_FIELD_TYPE = 7;

function isAttachmentField(fieldMeta: any): boolean {
  return fieldMeta.type === ATTACHMENT_FIELD_TYPE;
}

export async function getBitableContext() {
  if (!window.LarkBase) {
    await new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 300; // 等待 30 秒
      const interval = setInterval(() => {
        attempts++;
        if (window.LarkBase) {
          clearInterval(interval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('飞书多维表格 SDK 未加载。请确认：1. 已在飞书多维表格中打开此插件；2. 页面已完全加载。如问题持续，请刷新页面重试。'));
        }
      }, 100);
    });
  }
  const base = window.LarkBase.init();
  const table = await base.getActiveTable();
  return { table, base };
}

export async function getViewList(table: any): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
  const tableViews = await table.getViews();
  const activeView = await table.getActiveView();
  const activeViewId = activeView?.getId();

  return tableViews.map((view: any) => ({
    id: view.getId(),
    name: view.getName(),
    isActive: view.getId() === activeViewId,
  }));
}

export async function getExportPreview(
  table: any,
  view: any,
): Promise<ExportPreview> {
  const visibleFieldIds = await view.getVisibleFieldIdList();
  const visibleRecordIds = await view.getVisibleRecordIdList();

  const fields: ExportFieldInfo[] = [];
  const attachmentFields: string[] = [];

  for (const fieldId of visibleFieldIds) {
    const fieldMeta = await table.getFieldMetaById(fieldId);
    const isAttachment = isAttachmentField(fieldMeta);
    fields.push({
      id: fieldId,
      name: fieldMeta.name,
      type: fieldMeta.type,
      isAttachment,
    });
    if (isAttachment) {
      attachmentFields.push(fieldId);
    }
  }

  return {
    fields,
    recordCount: visibleRecordIds.length,
    attachmentFields,
  };
}

export async function loadExportData(
  table: any,
  view: any,
  config: ExportConfig,
  onProgress?: (current: number, total: number) => void,
): Promise<{ fields: ExportFieldInfo[]; records: ExportRecord[] }> {
  const visibleFieldIds = await view.getVisibleFieldIdList();
  const visibleRecordIds = await view.getVisibleRecordIdList();

  const fields: ExportFieldInfo[] = [];
  const attachmentFieldIds = new Set<string>();

  for (const fieldId of visibleFieldIds) {
    const fieldMeta = await table.getFieldMetaById(fieldId);
    const isAttachment = isAttachmentField(fieldMeta);
    fields.push({
      id: fieldId,
      name: fieldMeta.name,
      type: fieldMeta.type,
      isAttachment,
    });
    if (isAttachment) {
      attachmentFieldIds.add(fieldId);
    }
  }

  const records: ExportRecord[] = [];

  for (let i = 0; i < visibleRecordIds.length; i++) {
    const recordId = visibleRecordIds[i];
    const values: Record<string, unknown> = {};
    const attachmentUrls: Record<string, string[]> = {};

    for (const fieldId of visibleFieldIds) {
      const field = await table.getField(fieldId);
      const value = await field.getValue(recordId);
      values[fieldId] = value;

      if (attachmentFieldIds.has(fieldId) && config.embedImages) {
        const urls = await table.getCellAttachmentUrls(recordId, fieldId);
        attachmentUrls[fieldId] = urls;
      }
    }

    records.push({ recordId, values, attachmentUrls });
    onProgress?.(i + 1, visibleRecordIds.length);
  }

  return { fields, records };
}

function formatCellValue(_field: ExportFieldInfo, value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        return String(obj.name || obj.text || JSON.stringify(item));
      }
      return String(item);
    }).join(', ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return String(obj.name || obj.text || JSON.stringify(value));
  }
  return String(value);
}

function buildSheet(
  fields: ExportFieldInfo[],
  records: ExportRecord[],
  config: ExportConfig,
): { ws: XLSX.WorkSheet; imageCount: number } {
  const headers = fields.map((f) => f.name);
  const wsData: unknown[][] = [headers];

  for (const record of records) {
    const row: unknown[] = fields.map((field) => {
      const value = record.values[field.id];
      return formatCellValue(field, value);
    });
    wsData.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  if (config.mergeAdjacentCells) {
    const mergeRanges: XLSX.Range[] = [];

    for (let col = 0; col < fields.length; col++) {
      let startRow = 1;

      for (let row = 2; row <= records.length; row++) {
        const currentValue = wsData[row]?.[col];
        const prevValue = wsData[row - 1]?.[col];

        const currentStr = typeof currentValue === 'object' && currentValue !== null
          ? String((currentValue as XLSX.CellObject).v ?? currentValue)
          : String(currentValue ?? '');
        const prevStr = typeof prevValue === 'object' && prevValue !== null
          ? String((prevValue as XLSX.CellObject).v ?? prevValue)
          : String(prevValue ?? '');

        if (currentStr !== prevStr || currentStr === '') {
          if (startRow < row - 1) {
            mergeRanges.push({
              s: { r: startRow, c: col },
              e: { r: row - 1, c: col },
            });
          }
          startRow = row;
        }
      }

      if (startRow < records.length) {
        mergeRanges.push({
          s: { r: startRow, c: col },
          e: { r: records.length, c: col },
        });
      }
    }

    ws['!merges'] = mergeRanges;
  }

  return { ws, imageCount: 0 };
}

async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function embedImagesToSheet(
  fields: ExportFieldInfo[],
  records: ExportRecord[],
  ws: XLSX.WorkSheet,
): Promise<number> {
  const images: Array<Record<string, unknown>> = [];
  let loadedCount = 0;

  for (let rowIndex = 0; rowIndex < records.length; rowIndex++) {
    const record = records[rowIndex];
    const excelRowIndex = rowIndex + 1;

    for (const field of fields) {
      if (!field.isAttachment) continue;
      const urls = record.attachmentUrls[field.id];
      if (!urls || urls.length === 0) continue;

      const colIndex = fields.indexOf(field);

      for (let imgIdx = 0; imgIdx < urls.length; imgIdx++) {
        try {
          const base64 = await loadImageAsBase64(urls[imgIdx]);
          const base64Data = base64.split(',')[1];

          images.push({
            name: `img_${excelRowIndex}_${colIndex}_${imgIdx}`,
            data: base64Data,
            opts: {
              type: 'base64',
              base64: true,
            },
            position: {
              type: 'cell',
              from: {
                col: colIndex,
                row: excelRowIndex,
              },
            },
            dimensions: {
              width: 100,
              height: 100,
            },
          });
          loadedCount++;
        } catch {
          // skip failed images
        }
      }
    }
  }

  if (images.length > 0) {
    (ws as Record<string, unknown>)['!images'] = images;
  }

  return loadedCount;
}

export async function exportMultipleViewsToExcel(
  viewsData: ViewExportData[],
  config: ExportConfig,
  tableName: string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const wb = XLSX.utils.book_new();

  let totalSteps = 0;
  for (const viewData of viewsData) {
    totalSteps += viewData.records.length;
    if (config.embedImages) {
      totalSteps += viewData.records.length;
    }
  }
  let completedSteps = 0;

  for (const viewData of viewsData) {
    const { ws } = buildSheet(viewData.fields, viewData.records, config);

    if (config.embedImages) {
      await embedImagesToSheet(viewData.fields, viewData.records, ws);
    }

    completedSteps += viewData.records.length;
    if (config.embedImages) {
      completedSteps += viewData.records.length;
    }
    onProgress?.(completedSteps, totalSteps);

    const sheetName = viewData.viewName.length > 31
      ? viewData.viewName.slice(0, 31)
      : viewData.viewName;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `${tableName}_${timestamp}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
