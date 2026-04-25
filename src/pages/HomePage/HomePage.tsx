import React, { useState, useCallback, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { toast } from 'sonner';
import {
  FileSpreadsheet,
  Eye,
  Settings2,
  Layers,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  getBitableContext,
  getViewList,
  getExportPreview,
  loadExportData,
  exportMultipleViewsToExcel,
  type ExportFieldInfo,
  type ExportPreview,
  type ExportConfig,
  type ViewExportData,
} from './export-excel';

const DEFAULT_CONFIG: ExportConfig = {
  mergeAdjacentCells: true,
  embedImages: false,
};

const HomePage: React.FC = () => {
  const [views, setViews] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [selectedViewIds, setSelectedViewIds] = useState<string[]>([]);
  const [config, setConfig] = useState<ExportConfig>(DEFAULT_CONFIG);
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportTotal, setExportTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');

  useEffect(() => {
    loadViews();
  }, []);

  const loadViews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { table } = await getBitableContext();
      const tableMeta = await table.getTableMeta();
      setTableName(tableMeta.name);

      const viewList = await getViewList(table);
      setViews(viewList);

      const activeView = viewList.find((v) => v.isActive);
      if (activeView) {
        setSelectedViewIds([activeView.id]);
      } else if (viewList.length > 0) {
        setSelectedViewIds([viewList[0].id]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载视图失败';
      setError(message);
      toast.error('加载失败', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleViewToggle = useCallback((viewId: string) => {
    setSelectedViewIds((prev) =>
      prev.includes(viewId)
        ? prev.filter((id) => id !== viewId)
        : [...prev, viewId],
    );
  }, []);

  const handlePreview = useCallback(async () => {
    if (selectedViewIds.length === 0) {
      toast.warning('请先选择至少一个视图');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { table } = await getBitableContext();
      const view = await table.getViewById(selectedViewIds[0]);
      const previewData = await getExportPreview(table, view);
      setPreview(previewData);
      toast.success('预览加载成功');
    } catch (err) {
      const message = err instanceof Error ? err.message : '预览数据加载失败';
      setError(message);
      toast.error('预览失败', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [selectedViewIds]);

  const handleExport = useCallback(async () => {
    if (selectedViewIds.length === 0) {
      toast.warning('请先选择至少一个视图');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportTotal(0);
    setError(null);

    try {
      const { table } = await getBitableContext();
      const allViewsData: ViewExportData[] = [];

      for (const viewId of selectedViewIds) {
        const view = await table.getViewById(viewId);
        const viewName = (await view.getViewMeta()).name;

        toast.info(`正在读取: ${viewName}`);

        const { fields, records } = await loadExportData(
          table,
          view,
          config,
          (current, total) => {
            setExportProgress(current);
            setExportTotal(total);
          },
        );

        allViewsData.push({ viewName, fields, records });
      }

      toast.info('正在生成 Excel 文件...');

      await exportMultipleViewsToExcel(
        allViewsData,
        config,
        tableName,
        (current, total) => {
          setExportProgress(current);
          setExportTotal(total);
        },
      );

      toast.success('导出完成', { description: '文件已开始下载' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '导出失败';
      setError(message);
      toast.error('导出失败', { description: message });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportTotal(0);
    }
  }, [selectedViewIds, config, tableName]);

  const progressPercent = exportTotal > 0 ? Math.round((exportProgress / exportTotal) * 100) : 0;

  return (
    <div className="min-w-[410px] w-full p-4 space-y-6 bg-background">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-foreground">多维表格智能导出</h1>
        <p className="text-sm text-muted-foreground">
          支持相邻单元格自动合并、图片嵌入导出
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>操作失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            选择导出视图
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && views.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="size-4 animate-spin" />
              加载视图中...
            </div>
          ) : views.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Layers className="size-6" />
                </EmptyMedia>
                <EmptyTitle>暂无可用视图</EmptyTitle>
                <EmptyDescription>请检查多维表格是否包含视图</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-2">
              {views.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center gap-3 py-2 hover-elevate rounded-md px-2"
                >
                  <Checkbox
                    checked={selectedViewIds.includes(view.id)}
                    onCheckedChange={() => handleViewToggle(view.id)}
                    id={`view-${view.id}`}
                  />
                  <Label
                    htmlFor={`view-${view.id}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    {view.name}
                  </Label>
                  {view.isActive && (
                    <Badge variant="secondary" className="text-xs">当前</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="size-4 text-muted-foreground" />
            导出配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                合并相邻相同单元格
              </Label>
              <p className="text-xs text-muted-foreground">
                自动识别相邻行的相同数据并合并
              </p>
            </div>
            <Switch
              checked={config.mergeAdjacentCells}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, mergeAdjacentCells: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                嵌入图片到 Excel
              </Label>
              <p className="text-xs text-muted-foreground">
                将多维表格中的图片嵌入到导出文件
              </p>
            </div>
            <Switch
              checked={config.embedImages}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, embedImages: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="size-4 text-muted-foreground" />
              数据预览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">记录数量：</span>
                <span className="font-medium">{preview.recordCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">字段数量：</span>
                <span className="font-medium">{preview.fields.length}</span>
              </div>
            </div>

            {preview.attachmentFields.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">图片字段：</span>
                {preview.attachmentFields.map((fieldId) => {
                  const field = preview.fields.find((f) => f.id === fieldId);
                  return field ? (
                    <Badge key={fieldId} variant="outline" className="text-xs">
                      {field.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">字段列表：</span>
              <div className="flex flex-wrap gap-1">
                {preview.fields.map((field) => (
                  <Badge
                    key={field.id}
                    variant={field.isAttachment ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {field.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isExporting && (
        <Card className="border-border">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">导出进度</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
            <p className="text-xs text-muted-foreground">
              {exportProgress} / {exportTotal}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={isLoading || isExporting || selectedViewIds.length === 0}
          className="flex-1"
        >
          <Eye className="size-4 mr-2" />
          预览数据
        </Button>
        <Button
          onClick={handleExport}
          disabled={isLoading || isExporting || selectedViewIds.length === 0}
          className="flex-1"
        >
          {isExporting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              导出中...
            </>
          ) : (
            <>
              <FileSpreadsheet className="size-4 mr-2" />
              开始导出
            </>
          )}
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={loadViews}
        disabled={isLoading}
        className="w-full"
      >
        <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        刷新视图列表
      </Button>
    </div>
  );
};

export default HomePage;
