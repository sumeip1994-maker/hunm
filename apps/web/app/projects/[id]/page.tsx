"use client";

import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileArchive,
  FileText,
  FolderTree,
  GraduationCap,
  ImageIcon,
  Layers3,
  Library,
  Loader2,
  MessageSquareText,
  Presentation,
  RefreshCcw,
  Settings,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  Wand2,
} from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { presentationTypeLabels } from "@/components/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { api, apiBaseUrl } from "@/lib/api/client";
import type { Artifact, DocumentItem, Project } from "@/types";

type ContentTab = "documents" | "analysis" | "literature" | "outline";
type PptTab = "ppt" | "editor" | "design";
type AssistTab = "script" | "qa";
type SettingsTab = "info" | "versions" | "export";
type WorkspaceSection = "cockpit" | "content" | "pptWorkspace" | "assist" | "settings" | "knowledge";

interface OutlineContent {
  sections: { title: string; level: number }[];
}

const contentTabs: { key: ContentTab; label: string }[] = [
  { key: "documents", label: "资料中心" },
  { key: "analysis", label: "内容提炼" },
  { key: "literature", label: "文献增强" },
  { key: "outline", label: "页面大纲" },
];

const pptTabs: { key: PptTab; label: string }[] = [
  { key: "ppt", label: "PPT生成" },
  { key: "editor", label: "页面编辑" },
  { key: "design", label: "版式优化" },
];

const assistTabs: { key: AssistTab; label: string }[] = [
  { key: "script", label: "讲稿" },
  { key: "qa", label: "专家问答" },
];

const settingsTabs: { key: SettingsTab; label: string }[] = [
  { key: "info", label: "项目信息" },
  { key: "versions", label: "版本记录" },
  { key: "export", label: "导出" },
];

const cockpitStats = [
  { label: "病例资料", value: "2", tone: "bg-rose-50 text-rose-700" },
  { label: "文献", value: "5", tone: "bg-blue-50 text-blue-700" },
  { label: "图片", value: "12", tone: "bg-teal-50 text-teal-700" },
  { label: "指南", value: "0", tone: "bg-amber-50 text-amber-700" },
  { label: "PPT", value: "1", tone: "bg-violet-50 text-violet-700" },
];

const progressItems = [
  { label: "资料完整度", value: 80 },
  { label: "证据完整度", value: 45 },
  { label: "页面完成度", value: 20 },
  { label: "PPT完成度", value: 10 },
];

const scores = [
  { label: "学术性", value: "78", width: "78%" },
  { label: "逻辑性", value: "65", width: "65%" },
  { label: "证据性", value: "42", width: "42%" },
  { label: "视觉性", value: "--", width: "0%" },
];

const recognizedCards = [
  { label: "病例资料", value: "2份", icon: FileText, tone: "bg-rose-50 text-rose-700" },
  { label: "文献", value: "5篇", icon: BookOpenCheck, tone: "bg-blue-50 text-blue-700" },
  { label: "图片", value: "12张", icon: ImageIcon, tone: "bg-teal-50 text-teal-700" },
  { label: "已有PPT", value: "1份", icon: Presentation, tone: "bg-violet-50 text-violet-700" },
  { label: "指南", value: "0份", icon: GraduationCap, tone: "bg-amber-50 text-amber-700" },
];

const fallbackTree = [
  { group: "病例资料", items: ["出院记录.pdf", "病程记录.pdf"] },
  { group: "文献", items: ["paper1.pdf", "paper2.pdf"] },
  { group: "图片", items: ["OCT1.jpg", "OCT2.jpg"] },
  { group: "已有PPT", items: ["病例讨论初稿.pptx"] },
  { group: "指南", items: ["等待补充"] },
];

const aiSteps = ["资料识别", "资料分类", "资料摘要", "问题发现", "证据缺失分析"];

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("cockpit");
  const [contentTab, setContentTab] = useState<ContentTab>("documents");
  const [pptTab, setPptTab] = useState<PptTab>("ppt");
  const [assistTab, setAssistTab] = useState<AssistTab>("script");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("info");
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [scriptDuration, setScriptDuration] = useState(20);
  const [aiWorking, setAiWorking] = useState(false);

  const latest = useMemo(() => {
    const map = new Map<string, Artifact>();
    artifacts.forEach((artifact) => {
      const existing = map.get(artifact.type);
      if (!existing || artifact.version > existing.version) map.set(artifact.type, artifact);
    });
    return map;
  }, [artifacts]);

  async function refresh() {
    const [projectData, docData, artifactData] = await Promise.all([api.getProject(projectId), api.listDocuments(projectId), api.listArtifacts(projectId)]);
    setProject(projectData);
    setDocuments(docData);
    setArtifacts(artifactData);
  }

  useEffect(() => {
    refresh()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!aiWorking) return;
    const timer = window.setTimeout(() => setAiWorking(false), 7000);
    return () => window.clearTimeout(timer);
  }, [aiWorking]);

  async function run(name: string, action: string, query = "") {
    setBusy(name);
    setError("");
    try {
      await api.runArtifact(projectId, action, query);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setBusy("");
    }
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setBusy("upload");
    setError("");
    setAiWorking(true);
    try {
      for (const file of files) {
        await api.uploadDocument(projectId, file);
      }
      await refresh();
      setActiveSection("content");
      setContentTab("documents");
      event.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setBusy("");
    }
  }

  async function deleteDocument(doc: DocumentItem) {
    if (!window.confirm(`确认删除“${doc.original_filename}”？`)) return;
    setError("");
    try {
      await api.deleteDocument(doc.id);
      setDocuments((items) => items.filter((item) => item.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function generatePpt() {
    setBusy("ppt");
    setError("");
    try {
      const result = await api.generatePpt(projectId);
      setDownloadUrl(`${apiBaseUrl}${result.download_url}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PPT生成失败");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <main className="min-h-screen p-8 text-sm text-slate-500">正在加载项目驾驶舱...</main>;
  if (!project) return <main className="min-h-screen p-8 text-sm text-red-700">项目不存在或加载失败</main>;

  const analysis = latest.get("analysis_report")?.content_json;
  const directions = latest.get("direction_recommendation")?.content_json;
  const outline = latest.get("outline")?.content_json as OutlineContent | undefined;
  const review = latest.get("review_report")?.content_json;
  const qa = latest.get("qa_report")?.content_json;
  const script = latest.get("script")?.content_json;

  return (
    <main className="min-h-screen bg-[#f8f7fc] text-[#14102a]">
      <div className="mx-auto grid min-h-screen max-w-[1520px] gap-5 px-5 py-5 lg:grid-cols-[250px_minmax(0,1fr)_340px]">
        <WorkspaceNav activeSection={activeSection} setActiveSection={setActiveSection} />

        <section className="min-w-0 space-y-5">
          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          <ProjectCockpit project={project} />
          {aiWorking ? <AIWorkingBanner /> : null}
          {activeSection === "cockpit" ? (
            <CockpitHome
              project={project}
              documents={documents}
              busy={busy}
              onUpload={onUpload}
              onGenerateOutline={() => {
                setActiveSection("content");
                setContentTab("outline");
                run("outline", "outline");
              }}
              onAnalyze={() => {
                setActiveSection("content");
                setContentTab("analysis");
                run("analyze", "analyze");
              }}
              onGeneratePpt={() => {
                setActiveSection("pptWorkspace");
                setPptTab("ppt");
                generatePpt();
              }}
              onDelete={deleteDocument}
            />
          ) : null}
          {activeSection === "content" ? (
            <TabbedPanel tabs={contentTabs} active={contentTab} onChange={(key) => setContentTab(key as ContentTab)}>
              {contentTab === "documents" ? <DocumentsCenter documents={documents} busy={busy} aiWorking={aiWorking} onUpload={onUpload} onDelete={deleteDocument} /> : null}
              {contentTab === "analysis" ? <AnalysisCenter analysis={analysis} busy={busy} onRun={() => run("analyze", "analyze")} /> : null}
              {contentTab === "literature" ? <LiteratureCenter analysis={analysis} busy={busy} onRun={() => run("analyze", "analyze")} /> : null}
              {contentTab === "outline" ? <OutlineCenter outline={outline} directions={directions} busy={busy} onDirections={() => run("directions", "directions")} onOutline={() => run("outline", "outline")} /> : null}
            </TabbedPanel>
          ) : null}
          {activeSection === "pptWorkspace" ? (
            <TabbedPanel tabs={pptTabs} active={pptTab} onChange={(key) => setPptTab(key as PptTab)}>
              <PptWorkspaceShell>
                {pptTab === "ppt" ? <PptCenter busy={busy} downloadUrl={downloadUrl} onGenerate={generatePpt} /> : null}
                {pptTab === "editor" ? <EditorCenter outline={outline} /> : null}
                {pptTab === "design" ? <DesignCenter review={review} busy={busy} onRun={() => run("review", "review")} /> : null}
              </PptWorkspaceShell>
            </TabbedPanel>
          ) : null}
          {activeSection === "assist" ? (
            <TabbedPanel tabs={assistTabs} active={assistTab} onChange={(key) => setAssistTab(key as AssistTab)}>
              {assistTab === "script" ? <ScriptCenter script={script} duration={scriptDuration} setDuration={setScriptDuration} busy={busy} onRun={() => run("script", "script", `?duration=${scriptDuration}`)} /> : null}
              {assistTab === "qa" ? <QACenter qa={qa} busy={busy} onRun={() => run("qa", "qa")} /> : null}
            </TabbedPanel>
          ) : null}
          {activeSection === "settings" ? (
            <TabbedPanel tabs={settingsTabs} active={settingsTab} onChange={(key) => setSettingsTab(key as SettingsTab)}>
              {settingsTab === "info" ? <InfoCenter project={project} /> : null}
              {settingsTab === "versions" ? <VersionCenter artifacts={artifacts} /> : null}
              {settingsTab === "export" ? <ExportCenter downloadUrl={downloadUrl} projectId={projectId} /> : null}
            </TabbedPanel>
          ) : null}
          {activeSection === "knowledge" ? <KnowledgeBase /> : null}
        </section>

        <AICopilot />
      </div>
    </main>
  );
}

function WorkspaceNav({ activeSection, setActiveSection }: { activeSection: WorkspaceSection; setActiveSection: (section: WorkspaceSection) => void }) {
  const items: { key: WorkspaceSection; label: string; caption: string; icon: typeof Target }[] = [
    { key: "cockpit", label: "项目驾驶舱", caption: "状态与决策", icon: Target },
    { key: "content", label: "内容制作", caption: "资料、提炼、证据、大纲", icon: ClipboardList },
    { key: "pptWorkspace", label: "PPT工作区", caption: "生成、编辑、版式", icon: Presentation },
    { key: "assist", label: "汇报辅助", caption: "讲稿、专家问答", icon: MessageSquareText },
    { key: "settings", label: "项目设置", caption: "信息、版本、导出", icon: Settings },
    { key: "knowledge", label: "我的知识库", caption: "历史资料复用", icon: Library },
  ];
  return (
    <aside className="sticky top-5 h-[calc(100vh-40px)] rounded-md border border-violet-100 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Medical Studio</p>
          <p className="text-xs text-slate-500">医学学术PPT工作台</p>
        </div>
      </div>
      <nav className="mt-5 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.key;
          return (
            <button
              key={item.key}
              className={`group w-full rounded-md px-3 py-3 text-left transition ${active ? "bg-violet-600 text-white shadow-sm" : "text-slate-700 hover:bg-violet-50"}`}
              onClick={() => setActiveSection(item.key)}
            >
              <span className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${active ? "text-white" : "text-violet-600"}`} />
                <span className="font-medium">{item.label}</span>
              </span>
              <span className={`mt-1 block pl-7 text-xs ${active ? "text-white/75" : "text-slate-400"}`}>{item.caption}</span>
            </button>
          );
        })}
      </nav>
      <div className="absolute bottom-4 left-4 right-4 rounded-md border border-violet-100 bg-violet-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-violet-700">当前定位</p>
        <p className="mt-1 leading-5">高质量医学PPT制作，不是演讲训练或项目管理。</p>
      </div>
    </aside>
  );
}

function ProjectCockpit({ project }: { project: Project }) {
  return (
    <section className="rounded-md border border-violet-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold text-violet-600">项目概览</p>
            <StatusBadge status={project.status} />
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{project.title || "白血病相关眼病"}</h1>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <p>项目类型：{presentationTypeLabels[project.presentation_type] || "病例讨论"}</p>
            <p>听众：{project.audience || "科室医生"}</p>
            <p>预计时长：{project.duration_minutes || 20}分钟</p>
          </div>
        </div>
        <div className="grid min-w-[260px] grid-cols-5 gap-2">
          {cockpitStats.map((item) => (
            <div key={item.label} className={`rounded-md px-3 py-2 text-center ${item.tone}`}>
              <p className="text-lg font-semibold">{item.value}</p>
              <p className="mt-1 text-[11px]">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {progressItems.map((item) => (
          <ProgressCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </section>
  );
}

function ProgressCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-violet-700">{value}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white">
        <div className="h-2 rounded-full bg-violet-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function AIWorkingBanner() {
  return (
    <section className="rounded-md border border-violet-200 bg-violet-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-violet-700" />
          <div>
            <p className="font-semibold text-violet-900">AI正在处理新资料</p>
            <p className="mt-1 text-sm text-violet-700">上传后已自动开始识别、分类、摘要和证据缺失分析。</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {aiSteps.map((step) => (
            <span key={step} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-700">
              {step}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CockpitHome({
  project,
  documents,
  busy,
  onUpload,
  onGenerateOutline,
  onAnalyze,
  onGeneratePpt,
  onDelete,
}: {
  project: Project;
  documents: DocumentItem[];
  busy: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onGenerateOutline: () => void;
  onAnalyze: () => void;
  onGeneratePpt: () => void;
  onDelete: (doc: DocumentItem) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <RecommendedNextSteps busy={busy} onGenerateOutline={onGenerateOutline} onAnalyze={onAnalyze} onGeneratePpt={onGeneratePpt} />
        <ScorePanel />
      </section>
      <DocumentsCenter documents={documents} busy={busy} aiWorking={false} compact onUpload={onUpload} onDelete={onDelete} />
      <PptSnapshot project={project} />
    </div>
  );
}

function RecommendedNextSteps({ busy, onGenerateOutline, onAnalyze, onGeneratePpt }: { busy: string; onGenerateOutline: () => void; onAnalyze: () => void; onGeneratePpt: () => void }) {
  const steps = [
    { title: "生成页面大纲", time: "预计30秒", action: "开始生成", icon: FolderTree, onClick: onGenerateOutline, loading: busy === "outline" },
    { title: "补充关键证据", time: "预计2分钟", action: "开始补充", icon: BookOpenCheck, onClick: onAnalyze, loading: busy === "analyze" },
    { title: "生成PPT初稿", time: "预计1分钟", action: "开始生成", icon: Presentation, onClick: onGeneratePpt, loading: busy === "ppt" },
  ];
  return (
    <section className="rounded-md border border-violet-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-violet-600">推荐下一步</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">先补齐证据，再生成初稿</h2>
        </div>
        <Sparkles className="h-5 w-5 text-violet-600" />
      </div>
      <div className="mt-5 grid gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex flex-col gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-violet-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{step.time}</p>
                </div>
              </div>
              <button className="btn-primary" onClick={step.onClick} disabled={step.loading}>
                {step.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                {step.loading ? "处理中..." : step.action}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScorePanel() {
  return (
    <section className="rounded-md border border-violet-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-violet-600">项目评分</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">综合评分 61</h2>
        </div>
        <BarChart3 className="h-5 w-5 text-violet-600" />
      </div>
      <div className="mt-5 space-y-4">
        {scores.map((score) => (
          <div key={score.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{score.label}</span>
              <span className="font-semibold text-slate-950">{score.value}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-violet-600" style={{ width: score.width }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-md bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500">评分趋势</p>
        <div className="mt-3 flex h-14 items-end gap-2">
          {[38, 46, 53, 57, 61].map((height, index) => (
            <div key={index} className="flex-1 rounded-t bg-violet-200" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DocumentsCenter({
  documents,
  busy,
  aiWorking,
  compact,
  onUpload,
  onDelete,
}: {
  documents: DocumentItem[];
  busy: string;
  aiWorking: boolean;
  compact?: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDelete: (doc: DocumentItem) => void;
}) {
  return (
    <section className="rounded-md border border-violet-100 bg-white p-5 shadow-sm">
      <SectionTitle eyebrow="资料中心" title="AI已识别资料" description="系统按医学PPT制作场景自动识别病例、文献、图片、已有PPT和指南缺口。" />
      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        {recognizedCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-md border border-slate-100 bg-slate-50 p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{card.value}</p>
            </div>
          );
        })}
      </div>
      {!compact ? (
        <label className="mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-violet-200 bg-violet-50 px-4 py-6 text-center transition hover:border-violet-500">
          <UploadCloud className="h-8 w-8 text-violet-600" />
          <span className="mt-3 text-sm font-semibold text-slate-950">{busy === "upload" ? "正在上传..." : "拖拽或点击上传资料"}</span>
          <span className="mt-1 text-xs text-slate-500">PDF / DOCX / PPTX / 图片 / Excel</span>
          <input className="hidden" type="file" multiple accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png,.xlsx,.xls" onChange={onUpload} disabled={busy === "upload"} />
        </label>
      ) : null}
      {aiWorking ? <AIWorkingBanner /> : null}
      <SourceTree documents={documents} onUpload={onUpload} onDelete={onDelete} />
    </section>
  );
}

function SourceTree({ documents, onUpload, onDelete }: { documents: DocumentItem[]; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onDelete: (doc: DocumentItem) => void }) {
  const grouped = useMemo(() => {
    if (documents.length === 0) return [];
    return documents.reduce<Record<string, DocumentItem[]>>((acc, doc) => {
      const key = normalizeCategory(doc);
      acc[key] = [...(acc[key] || []), doc];
      return acc;
    }, {});
  }, [documents]);

  return (
    <div className="mt-5 rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-violet-600" />
          <p className="font-semibold text-slate-950">资料树</p>
        </div>
        <span className="text-xs text-slate-500">预览 / 删除 / 重新上传</span>
      </div>
      <div className="grid gap-3">
        {documents.length === 0
          ? fallbackTree.map((group) => (
              <div key={group.group} className="rounded-md bg-white p-3">
                <p className="text-sm font-semibold text-slate-800">{group.group}</p>
                <div className="mt-2 grid gap-2">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2 text-sm text-slate-600">
                      <span>{item}</span>
                      <span className="text-xs text-slate-400">示例</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          : Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="rounded-md bg-white p-3">
                <p className="text-sm font-semibold text-slate-800">{group}</p>
                <div className="mt-2 grid gap-2">
                  {items.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-3 rounded border border-slate-100 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{doc.original_filename}</p>
                        <p className="mt-1 text-xs text-slate-400">{(doc.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-secondary aspect-square px-2" aria-label="预览">
                          <Eye className="h-4 w-4" />
                        </button>
                        <label className="btn-secondary aspect-square cursor-pointer px-2" aria-label="重新上传">
                          <RefreshCcw className="h-4 w-4" />
                          <input className="hidden" type="file" onChange={onUpload} />
                        </label>
                        <button className="btn-secondary aspect-square px-2 text-red-600 hover:border-red-200 hover:bg-red-50" onClick={() => onDelete(doc)} aria-label="删除">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

function normalizeCategory(doc: DocumentItem) {
  const filename = doc.original_filename.toLowerCase();
  if (filename.endsWith(".ppt") || filename.endsWith(".pptx")) return "已有PPT";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png")) return "图片";
  if (filename.includes("guide") || filename.includes("指南")) return "指南";
  if (filename.includes("paper") || filename.includes("文献")) return "文献";
  return doc.document_category || "病例资料";
}

function AICopilot() {
  const cards = [
    { title: "缺少指南支持", recommendation: "AAO 2024", action: "一键补充", icon: GraduationCap, tone: "bg-amber-50 text-amber-700" },
    { title: "缺少RCT证据", recommendation: "2篇高质量研究", action: "加入项目", icon: BookOpenCheck, tone: "bg-blue-50 text-blue-700" },
    { title: "逻辑结构问题", recommendation: "讨论部分偏弱", action: "自动优化", icon: Target, tone: "bg-rose-50 text-rose-700" },
    { title: "PPT结构问题", recommendation: "标题层级不统一", action: "一键修复", icon: Layers3, tone: "bg-violet-50 text-violet-700" },
  ];
  return (
    <aside className="sticky top-5 h-[calc(100vh-40px)] overflow-y-auto rounded-md border border-violet-100 bg-white/95 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-600" />
          <h2 className="font-semibold text-slate-950">AI学术顾问</h2>
        </div>
        <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">发现4个问题</span>
      </div>
      <p className="mt-4 text-xs font-semibold text-violet-600">AI发现</p>
      <div className="mt-3 space-y-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-md border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{card.title}</p>
                  <p className="mt-1 text-sm text-slate-500">推荐：{card.recommendation}</p>
                </div>
              </div>
              <button className="btn-secondary mt-4 w-full justify-center">{card.action}</button>
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-md border border-violet-100 bg-violet-50 p-4">
        <p className="text-sm font-semibold text-violet-900">副驾驶状态</p>
        <div className="mt-3 space-y-2 text-sm text-violet-700">
          <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> 资料分类已完成</p>
          <p className="flex items-center gap-2"><Loader2 className="h-4 w-4" /> 正在评估证据缺口</p>
        </div>
      </div>
    </aside>
  );
}

function TabbedPanel({ tabs, active, onChange, children }: { tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-violet-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {tabs.map((tab) => (
          <button key={tab.key} className={`rounded-full px-4 py-2 text-sm font-medium transition ${active === tab.key ? "bg-violet-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700"}`} onClick={() => onChange(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </section>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-violet-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function AnalysisCenter({ analysis, busy, onRun }: { analysis: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionTitle eyebrow="内容制作" title="内容提炼" description="把上传资料整理成PPT可用的核心问题、证据要点和风险边界。" />
      <ActionButton busy={busy === "analyze"} onClick={onRun} label={analysis ? "重新提炼" : "开始提炼"} />
      {analysis ? <ResultBlock items={[["资料摘要", String(analysis.summary || "")], ["关键问题", asList(analysis.key_questions).join(" / ")], ["学术价值", String(analysis.academic_value || "")], ["教学价值", String(analysis.teaching_value || "")], ["PPT重点", asList(analysis.suggested_focus).join(" / ")], ["风险提示", asList(analysis.risk_notes).join(" / ")]]} /> : <EmptyState title="尚未提炼内容" description="点击后AI会从资料中提取PPT核心内容。" />}
    </div>
  );
}

function LiteratureCenter({ analysis, busy, onRun }: { analysis: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionTitle eyebrow="内容制作" title="文献增强" description="检查当前PPT内容是否缺少指南、RCT、真实世界研究或关键文献支撑。" />
      <ActionButton busy={busy === "analyze"} onClick={onRun} label="分析证据缺口" />
      <div className="mt-5 grid gap-3">
        <ListCard title="可补充证据方向" items={analysis ? [...asList(analysis.key_questions).slice(0, 3), ...asList(analysis.risk_notes).slice(0, 2)] : ["AAO 2024 指南支持", "补充2篇高质量RCT研究", "真实世界研究证据"]} />
      </div>
    </div>
  );
}

function OutlineCenter({ outline, directions, busy, onDirections, onOutline }: { outline: OutlineContent | undefined; directions: Record<string, unknown> | undefined; busy: string; onDirections: () => void; onOutline: () => void }) {
  return (
    <div>
      <SectionTitle eyebrow="内容制作" title="页面大纲" description="先确定PPT叙事路径，再确认每一页承担的学术任务。" />
      <div className="mt-4 flex flex-wrap gap-3">
        <ActionButton busy={busy === "directions"} onClick={onDirections} label={directions ? "重新生成方向" : "生成汇报方向"} />
        <ActionButton busy={busy === "outline"} onClick={onOutline} label={outline ? "重新生成大纲" : "生成页面大纲"} />
      </div>
      <Directions content={directions} />
      <EditableOutline outline={outline} />
    </div>
  );
}

function PptWorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-slate-100 bg-slate-50 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoPill label="当前PPT版本" value="V1" />
          <InfoPill label="创建时间" value="2026/6/8 10:23" />
          <InfoPill label="最近修改" value="2026/6/9 15:40" />
        </div>
      </section>
      <section className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <PageTree />
        <div>{children}</div>
      </section>
    </div>
  );
}

function PageTree() {
  const pages = ["标题页", "背景", "病例介绍", "治疗经过", "讨论", "总结"];
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-950">页面树</p>
        <span className="text-xs text-slate-400">拖拽排序</span>
      </div>
      <div className="mt-4 space-y-2">
        {pages.map((page, index) => (
          <div key={page} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
            <span>{index + 1}. {page}</span>
            <button className="text-slate-400 hover:text-red-600" aria-label="删除页面">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        <button className="btn-secondary w-full">新增页面</button>
        <button className="btn-secondary w-full">AI推荐新增页面</button>
      </div>
    </div>
  );
}

function PptCenter({ busy, downloadUrl, onGenerate }: { busy: string; downloadUrl: string; onGenerate: () => void }) {
  return (
    <div>
      <SectionTitle eyebrow="PPT工作区" title="PPT生成" description="根据资料提炼、文献增强和页面大纲生成可下载PPTX。" />
      <button className="btn-primary mt-4" onClick={onGenerate} disabled={busy === "ppt"}>
        {busy === "ppt" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy === "ppt" ? "正在生成..." : "生成PPT初稿"}
      </button>
      {downloadUrl ? <DownloadButton href={downloadUrl} /> : <EmptyState title="等待生成PPT" description="生成后会显示下载按钮，并进入版式优化。" />}
    </div>
  );
}

function EditorCenter({ outline }: { outline: OutlineContent | undefined }) {
  return (
    <div>
      <SectionTitle eyebrow="PPT工作区" title="页面编辑" description="查看和调整页面标题、顺序与每页内容任务。" />
      <EditableOutline outline={outline} />
    </div>
  );
}

function DesignCenter({ review, busy, onRun }: { review: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionTitle eyebrow="PPT工作区" title="版式优化" description="从学术性、逻辑、证据和视觉表达四个维度优化PPT。" />
      <ActionButton busy={busy === "review"} onClick={onRun} label={review ? "重新优化" : "生成优化建议"} />
      <ReviewView content={review} />
    </div>
  );
}

function ScriptCenter({ script, duration, setDuration, busy, onRun }: { script: Record<string, unknown> | undefined; duration: number; setDuration: (value: number) => void; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionTitle eyebrow="汇报辅助" title="讲稿" description="最终汇报前生成讲者备注和口头表达提示。" />
      <div className="mb-4 mt-4 flex flex-wrap items-center gap-3">
        <select className="input w-40" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
          <option value={10}>10分钟版</option>
          <option value={20}>20分钟版</option>
          <option value={30}>30分钟版</option>
        </select>
        <ActionButton busy={busy === "script"} onClick={onRun} label="生成讲稿" />
      </div>
      <ScriptView content={script} />
    </div>
  );
}

function QACenter({ qa, busy, onRun }: { qa: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionTitle eyebrow="汇报辅助" title="专家问答" description="默认折叠在汇报辅助区域，不影响主制作流程。" />
      <ActionButton busy={busy === "qa"} onClick={onRun} label={qa ? "重新生成问答" : "生成专家问答"} />
      <QAView content={qa} />
    </div>
  );
}

function InfoCenter({ project }: { project: Project }) {
  return (
    <div>
      <SectionTitle eyebrow="项目设置" title="项目信息" description="项目基础信息后置管理，不打断PPT制作流程。" />
      <ResultBlock items={[["项目名称", project.title], ["PPT类型", presentationTypeLabels[project.presentation_type]], ["目标听众", project.audience], ["预计时长", `${project.duration_minutes}分钟`], ["核心问题", project.core_question || "暂无"]]} />
    </div>
  );
}

function VersionCenter({ artifacts }: { artifacts: Artifact[] }) {
  const pptVersions = artifacts.filter((artifact) => ["outline", "review_report", "script", "qa_report", "analysis_report"].includes(artifact.type));
  const versions = pptVersions.length ? pptVersions : [];
  return (
    <div>
      <SectionTitle eyebrow="项目设置" title="版本记录" description="保留关键PPT版本，支持后续查看、恢复和下载。" />
      <div className="mt-5 grid gap-3">
        {versions.length === 0 ? (
          ["PPT V1", "PPT V2", "PPT V3"].map((version, index) => (
            <div key={version} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 p-4 text-sm">
              <div>
                <p className="font-semibold text-slate-950">{version}</p>
                <p className="mt-1 text-slate-500">{index === 0 ? "初稿版本" : index === 1 ? "证据增强版本" : "版式优化版本"}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary">查看</button>
                <button className="btn-secondary">恢复</button>
                <button className="btn-secondary">下载</button>
              </div>
            </div>
          ))
        ) : null}
        {versions.map((artifact) => (
          <div key={artifact.id} className="rounded-md border border-slate-100 bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-900">{artifact.type} V{artifact.version}</p>
            <p className="mt-1 text-slate-500">{new Date(artifact.created_at).toLocaleString("zh-CN")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportCenter({ downloadUrl, projectId }: { downloadUrl: string; projectId: number }) {
  return (
    <div>
      <SectionTitle eyebrow="项目设置" title="导出" description="导出当前PPT文件和后续版本。" />
      <DownloadButton href={downloadUrl || `${apiBaseUrl}/projects/${projectId}/ppt/download`} />
    </div>
  );
}

function KnowledgeBase() {
  const entries = [
    { title: "历史病例", count: "12份", icon: FileArchive },
    { title: "历史PPT", count: "8份", icon: Presentation },
    { title: "历史文献", count: "46篇", icon: BookOpenCheck },
    { title: "历史图片", count: "128张", icon: ImageIcon },
  ];
  return (
    <section className="rounded-md border border-violet-100 bg-white p-5 shadow-sm">
      <SectionTitle eyebrow="我的知识库" title="跨项目复用资料" description="沉淀历史病例、PPT、文献和图片，后续可一键复用到新项目。" />
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <div key={entry.title} className="rounded-md border border-slate-100 bg-slate-50 p-4">
              <Icon className="h-6 w-6 text-violet-600" />
              <p className="mt-4 font-semibold text-slate-950">{entry.title}</p>
              <p className="mt-1 text-sm text-slate-500">{entry.count}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PptSnapshot({ project }: { project: Project }) {
  return (
    <section className="rounded-md border border-violet-100 bg-white p-5 shadow-sm">
      <SectionTitle eyebrow="PPT工作区预览" title="当前初稿结构" description={`${project.title} 的PPT结构正在围绕医学证据与病例讨论完善。`} />
      <div className="mt-5 grid gap-3 md:grid-cols-6">
        {["标题页", "背景", "病例介绍", "治疗经过", "讨论", "总结"].map((page, index) => (
          <div key={page} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
            <p className="text-xs text-slate-400">0{index + 1}</p>
            <p className="mt-3 font-semibold text-slate-900">{page}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ActionButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) {
  return (
    <button className="btn-primary mt-4" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {busy ? "处理中..." : label}
    </button>
  );
}

function DownloadButton({ href }: { href: string }) {
  return (
    <a className="btn-secondary mt-4 w-fit" href={href}>
      <Download className="h-4 w-4" />
      下载PPTX
    </a>
  );
}

function ResultBlock({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-5 grid gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border border-slate-100 bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="mt-2 leading-6 text-slate-600">{value || "暂无内容"}</p>
        </div>
      ))}
    </div>
  );
}

function Directions({ content }: { content: Record<string, unknown> | undefined }) {
  const directions = Array.isArray(content?.directions) ? content.directions : [];
  if (directions.length === 0) return null;
  return (
    <div className="mt-5 grid gap-3">
      {directions.map((item, index) => {
        const direction = item as Record<string, unknown>;
        return (
          <div key={index} className="rounded-md border border-violet-100 bg-violet-50 p-4 text-sm">
            <p className="font-semibold text-slate-900">{String(direction.name || "")}</p>
            <p className="mt-2 leading-6 text-slate-600">{String(direction.scenario || "")}</p>
            <p className="mt-2 leading-6 text-slate-600">{String(direction.reason || "")}</p>
            <p className="mt-2 text-slate-500">{asList(direction.structure).join(" / ")}</p>
          </div>
        );
      })}
    </div>
  );
}

function EditableOutline({ outline }: { outline: OutlineContent | undefined }) {
  const [sections, setSections] = useState(outline?.sections ?? []);
  useEffect(() => setSections(outline?.sections ?? []), [outline]);
  if (!outline) return <EmptyState title="尚未生成页面大纲" description="生成后可在这里调整页面标题和顺序。" />;
  return (
    <div className="mt-5 space-y-3">
      {sections.map((section, index) => (
        <div key={index} className="flex gap-2">
          <input className="input" value={section.title} onChange={(event) => setSections(sections.map((item, idx) => (idx === index ? { ...item, title: event.target.value } : item)))} />
          <button className="btn-secondary aspect-square px-2" onClick={() => setSections(sections.filter((_, idx) => idx !== index))} aria-label="删除页面">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ReviewView({ content }: { content: Record<string, unknown> | undefined }) {
  if (!content) return <EmptyState title="尚未生成优化建议" description="点击按钮后会按学术性、逻辑、证据和视觉表达给出修改建议。" />;
  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[["学术性", content.academic_score], ["逻辑性", content.logic_score], ["证据支撑", content.evidence_score], ["视觉表达", content.visual_score]].map(([label, value]) => (
          <Metric key={String(label)} label={String(label)} value={`${String(value || "-")}分`} />
        ))}
      </div>
      <ListCard title="主要问题" items={asList(content.issues)} />
      <ListCard title="修改建议" items={asList(content.suggestions)} />
      <ListCard title="优先处理" items={asList(content.priority_fixes)} />
    </div>
  );
}

function ScriptView({ content }: { content: Record<string, unknown> | undefined }) {
  if (!content) return <EmptyState title="尚未生成讲稿" description="讲稿放在汇报辅助区域，最终汇报前再处理。" />;
  const slides = Array.isArray(content.slides) ? content.slides : [];
  return (
    <div className="mt-5 space-y-3">
      <ListCard title="开场" items={[String(content.opening || "")]} />
      {slides.map((item, index) => {
        const slide = item as Record<string, unknown>;
        return <ListCard key={index} title={`${String(slide.slide_no || index + 1)}. ${String(slide.title || "")}`} items={[String(slide.script || ""), `转场：${String(slide.transition || "")}`]} />;
      })}
      <ListCard title="结尾" items={[String(content.closing || "")]} />
    </div>
  );
}

function QAView({ content }: { content: Record<string, unknown> | undefined }) {
  if (!content) return <EmptyState title="尚未生成专家问答" description="专家问答不再出现在核心制作流程中。" />;
  return (
    <div className="mt-5 grid gap-3">
      <ListCard title="主任可能会问" items={asList(content.director_questions)} />
      <ListCard title="专家可能会问" items={asList(content.expert_questions)} />
      <ListCard title="方法学追问" items={asList(content.methodology_questions)} />
      <ListCard title="回答思路" items={asList(content.reference_answers)} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-violet-100 bg-violet-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-violet-700">{value}</p>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-violet-100 bg-violet-50 p-4 text-sm">
      <p className="font-medium text-slate-900">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-2 text-slate-600">
          {items.map((item, index) => (
            <li key={index} className="leading-6">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-slate-500">暂无内容</p>
      )}
    </div>
  );
}
