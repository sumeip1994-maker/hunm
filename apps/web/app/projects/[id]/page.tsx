"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Bot, Download, Eye, FileUp, Loader2, PlugZap, RefreshCcw, Sparkles, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { presentationTypeLabels } from "@/components/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { api, apiBaseUrl } from "@/lib/api/client";
import type { Artifact, DocumentItem, Project } from "@/types";

type ViewKey = "documents" | "analysis" | "literature" | "outline" | "ppt" | "editor" | "design" | "script" | "qa" | "info" | "versions" | "export";

interface OutlineContent {
  sections: { title: string; level: number }[];
}

const navigationGroups: { title: string; items: { key: ViewKey; label: string }[] }[] = [
  {
    title: "内容制作",
    items: [
      { key: "documents", label: "资料中心" },
      { key: "analysis", label: "内容提炼" },
      { key: "literature", label: "文献增强" },
      { key: "outline", label: "页面大纲" },
    ],
  },
  {
    title: "PPT制作",
    items: [
      { key: "ppt", label: "PPT生成" },
      { key: "editor", label: "页面编辑" },
      { key: "design", label: "版式优化" },
    ],
  },
  {
    title: "汇报辅助",
    items: [
      { key: "script", label: "讲稿" },
      { key: "qa", label: "专家问答" },
    ],
  },
  {
    title: "项目管理",
    items: [
      { key: "info", label: "项目信息" },
      { key: "versions", label: "版本记录" },
      { key: "export", label: "导出" },
    ],
  },
];

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [activeView, setActiveView] = useState<ViewKey>("documents");
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [scriptDuration, setScriptDuration] = useState(20);

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
    try {
      for (const file of files) {
        await api.uploadDocument(projectId, file);
      }
      await refresh();
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

  if (loading) return <main className="min-h-screen p-8 text-sm text-slate-500">正在加载工作台...</main>;
  if (!project) return <main className="min-h-screen p-8 text-sm text-red-700">项目不存在或加载失败</main>;

  const analysis = latest.get("analysis_report")?.content_json;
  const directions = latest.get("direction_recommendation")?.content_json;
  const outline = latest.get("outline")?.content_json as OutlineContent | undefined;
  const review = latest.get("review_report")?.content_json;
  const qa = latest.get("qa_report")?.content_json;
  const script = latest.get("script")?.content_json;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-clinical-700">医生学术PPT工作台</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{project.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {presentationTypeLabels[project.presentation_type]} · {project.audience} · {project.duration_minutes}分钟
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/model-integration" className="btn-secondary">
              <PlugZap className="h-4 w-4" />
              AI能力中心
            </Link>
            <StatusBadge status={project.status} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[240px_1fr_320px]">
        <aside className="h-fit rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          {navigationGroups.map((group) => (
            <div key={group.title} className="mb-5 last:mb-0">
              <p className="px-2 text-xs font-semibold text-slate-400">{group.title}</p>
              <div className="mt-2 grid gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    className={`rounded-md px-3 py-2 text-left text-sm transition ${activeView === item.key ? "bg-clinical-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                    onClick={() => setActiveView(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <section className="min-w-0">
          {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            {activeView === "documents" ? <DocumentsCenter documents={documents} busy={busy} onUpload={onUpload} onDelete={deleteDocument} /> : null}
            {activeView === "analysis" ? <AnalysisCenter analysis={analysis} busy={busy} onRun={() => run("analyze", "analyze")} /> : null}
            {activeView === "literature" ? <LiteratureCenter analysis={analysis} busy={busy} onRun={() => run("analyze", "analyze")} /> : null}
            {activeView === "outline" ? <OutlineCenter outline={outline} directions={directions} busy={busy} onDirections={() => run("directions", "directions")} onOutline={() => run("outline", "outline")} /> : null}
            {activeView === "ppt" ? <PptCenter busy={busy} downloadUrl={downloadUrl} onGenerate={generatePpt} /> : null}
            {activeView === "editor" ? <EditorCenter outline={outline} /> : null}
            {activeView === "design" ? <DesignCenter review={review} busy={busy} onRun={() => run("review", "review")} /> : null}
            {activeView === "script" ? <ScriptCenter script={script} duration={scriptDuration} setDuration={setScriptDuration} busy={busy} onRun={() => run("script", "script", `?duration=${scriptDuration}`)} /> : null}
            {activeView === "qa" ? <QACenter qa={qa} busy={busy} onRun={() => run("qa", "qa")} /> : null}
            {activeView === "info" ? <InfoCenter project={project} /> : null}
            {activeView === "versions" ? <VersionCenter artifacts={artifacts} /> : null}
            {activeView === "export" ? <ExportCenter downloadUrl={downloadUrl} projectId={projectId} /> : null}
          </div>
        </section>

        <AcademicAdvisor documents={documents} analysis={analysis} review={review} />
      </div>
    </main>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5 border-b border-slate-200 pb-4">
      <h2 className="text-xl font-semibold tracking-normal text-slate-950">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function DocumentsCenter({ documents, busy, onUpload, onDelete }: { documents: DocumentItem[]; busy: string; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onDelete: (doc: DocumentItem) => void }) {
  return (
    <div>
      <SectionHeader title="资料中心" description="上传病例、文献、指南、图片、检查数据或已有PPT，系统会自动分类并用于后续PPT制作。" />
      <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-clinical-400">
        <FileUp className="h-8 w-8 text-clinical-700" />
        <span className="mt-3 text-sm font-medium text-slate-900">{busy === "upload" ? "正在上传..." : "拖拽或点击上传资料"}</span>
        <span className="mt-1 text-xs text-slate-500">PDF / DOCX / PPTX / 图片 / Excel</span>
        <input className="hidden" type="file" multiple accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png,.xlsx,.xls" onChange={onUpload} disabled={busy === "upload"} />
      </label>
      <div className="mt-5 grid gap-3">
        {documents.length === 0 ? <EmptyState title="还没有资料" description="先上传资料，AI会自动识别病例、文献、图片、检查数据和已有PPT。" /> : null}
        {documents.map((doc) => (
          <div key={doc.id} className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{doc.original_filename}</p>
                <p className="mt-1 text-slate-500">{doc.document_category} · {(doc.file_size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary aspect-square px-2" aria-label="预览资料">
                  <Eye className="h-4 w-4" />
                </button>
                <label className="btn-secondary aspect-square cursor-pointer px-2" aria-label="重新上传">
                  <RefreshCcw className="h-4 w-4" />
                  <input className="hidden" type="file" onChange={onUpload} />
                </label>
                <button className="btn-secondary aspect-square px-2 text-red-600 hover:border-red-200 hover:bg-red-50" onClick={() => onDelete(doc)} aria-label="删除资料">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisCenter({ analysis, busy, onRun }: { analysis: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionHeader title="内容提炼" description="把上传资料整理成PPT可用的核心问题、证据要点和风险边界。" />
      <ActionButton busy={busy === "analyze"} onClick={onRun} label={analysis ? "重新提炼" : "开始提炼"} />
      {analysis ? <ResultBlock items={[["资料摘要", String(analysis.summary || "")], ["关键问题", asList(analysis.key_questions).join(" / ")], ["学术价值", String(analysis.academic_value || "")], ["教学价值", String(analysis.teaching_value || "")], ["PPT重点", asList(analysis.suggested_focus).join(" / ")], ["风险提示", asList(analysis.risk_notes).join(" / ")]]} /> : <EmptyState title="尚未提炼内容" description="点击后AI会从资料中提取PPT核心内容。" />}
    </div>
  );
}

function LiteratureCenter({ analysis, busy, onRun }: { analysis: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionHeader title="文献增强" description="检查当前PPT内容是否缺少指南、RCT、真实世界研究或关键文献支撑。" />
      <ActionButton busy={busy === "analyze"} onClick={onRun} label="分析证据缺口" />
      <div className="mt-5 grid gap-3">
        <ListCard title="可补充证据方向" items={analysis ? [...asList(analysis.key_questions).slice(0, 3), ...asList(analysis.risk_notes).slice(0, 2)] : []} />
      </div>
    </div>
  );
}

function OutlineCenter({ outline, directions, busy, onDirections, onOutline }: { outline: OutlineContent | undefined; directions: Record<string, unknown> | undefined; busy: string; onDirections: () => void; onOutline: () => void }) {
  return (
    <div>
      <SectionHeader title="页面大纲" description="先确定PPT叙事路径，再确认每一页承担的学术任务。" />
      <div className="flex flex-wrap gap-3">
        <ActionButton busy={busy === "directions"} onClick={onDirections} label={directions ? "重新生成方向" : "生成汇报方向"} />
        <ActionButton busy={busy === "outline"} onClick={onOutline} label={outline ? "重新生成大纲" : "生成页面大纲"} />
      </div>
      <Directions content={directions} />
      <EditableOutline outline={outline} />
    </div>
  );
}

function PptCenter({ busy, downloadUrl, onGenerate }: { busy: string; downloadUrl: string; onGenerate: () => void }) {
  return (
    <div>
      <SectionHeader title="PPT生成" description="根据资料提炼、文献增强和页面大纲生成可下载PPTX。" />
      <button className="btn-primary" onClick={onGenerate} disabled={busy === "ppt"}>
        {busy === "ppt" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy === "ppt" ? "正在生成..." : "生成PPT"}
      </button>
      {downloadUrl ? <DownloadButton href={downloadUrl} /> : <EmptyState title="等待生成PPT" description="生成后会显示下载按钮，并进入版式优化。" />}
    </div>
  );
}

function EditorCenter({ outline }: { outline: OutlineContent | undefined }) {
  return (
    <div>
      <SectionHeader title="页面编辑" description="查看和调整页面标题、顺序与每页内容任务。" />
      <EditableOutline outline={outline} />
    </div>
  );
}

function DesignCenter({ review, busy, onRun }: { review: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionHeader title="版式优化" description="从学术性、逻辑、证据和视觉表达四个维度优化PPT。" />
      <ActionButton busy={busy === "review"} onClick={onRun} label={review ? "重新优化" : "生成优化建议"} />
      <ReviewView content={review} />
    </div>
  );
}

function ScriptCenter({ script, duration, setDuration, busy, onRun }: { script: Record<string, unknown> | undefined; duration: number; setDuration: (value: number) => void; busy: string; onRun: () => void }) {
  return (
    <div>
      <SectionHeader title="讲稿" description="最终汇报前生成讲者备注和口头表达提示。" />
      <div className="mb-4 flex flex-wrap items-center gap-3">
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
      <SectionHeader title="专家问答" description="作为汇报辅助模块，准备可能追问、方法学问题和回答思路。" />
      <ActionButton busy={busy === "qa"} onClick={onRun} label={qa ? "重新生成问答" : "生成专家问答"} />
      <QAView content={qa} />
    </div>
  );
}

function InfoCenter({ project }: { project: Project }) {
  return (
    <div>
      <SectionHeader title="项目信息" description="项目基础信息后置管理，不打断PPT制作流程。" />
      <ResultBlock items={[["项目名称", project.title], ["PPT类型", presentationTypeLabels[project.presentation_type]], ["目标听众", project.audience], ["预计时长", `${project.duration_minutes}分钟`], ["核心问题", project.core_question || "暂无"]]} />
    </div>
  );
}

function VersionCenter({ artifacts }: { artifacts: Artifact[] }) {
  const pptVersions = artifacts.filter((artifact) => ["outline", "review_report", "script", "qa_report", "analysis_report"].includes(artifact.type));
  return (
    <div>
      <SectionHeader title="版本记录" description="保留关键AI产物版本，后续可扩展为PPT V1 / V2 / V3 的恢复与下载。" />
      <div className="grid gap-3">
        {pptVersions.length === 0 ? <EmptyState title="暂无版本记录" description="生成内容后会在这里记录版本。" /> : null}
        {pptVersions.map((artifact) => (
          <div key={artifact.id} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
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
      <SectionHeader title="导出" description="导出当前PPT文件和后续版本。" />
      <DownloadButton href={downloadUrl || `${apiBaseUrl}/projects/${projectId}/ppt/download`} />
    </div>
  );
}

function AcademicAdvisor({ documents, analysis, review }: { documents: DocumentItem[]; analysis: Record<string, unknown> | undefined; review: Record<string, unknown> | undefined }) {
  const categories = documents.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.document_category] = (acc[doc.document_category] || 0) + 1;
    return acc;
  }, {});
  const risks = asList(analysis?.risk_notes);
  const issues = asList(review?.issues);
  return (
    <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-clinical-900">
        <Bot className="h-5 w-5" />
        <h2 className="font-semibold">AI学术顾问</h2>
      </div>
      <div className="mt-5 space-y-4 text-sm">
        <AdvisorBlock title="已识别内容" items={Object.keys(categories).length ? Object.entries(categories).map(([key, count]) => `${key} ${count}份`) : ["尚未识别资料"]} />
        <AdvisorBlock title="发现问题" items={issues.length ? issues.slice(0, 3) : risks.slice(0, 3)} />
        <AdvisorBlock title="缺失证据" items={risks.length ? risks.slice(0, 2) : ["等待内容提炼后判断指南、RCT或关键研究缺口"]} />
        <AdvisorBlock title="优化建议" items={asList(review?.suggestions).slice(0, 3)} />
      </div>
    </aside>
  );
}

function AdvisorBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium text-slate-900">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length ? items.map((item, index) => <p key={index} className="leading-6 text-slate-600">{item}</p>) : <p className="text-slate-400">暂无</p>}
      </div>
    </div>
  );
}

function ActionButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) {
  return (
    <button className="btn-primary" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {busy ? "生成中..." : label}
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
        <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
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
          <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
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
  if (!content) return <EmptyState title="尚未生成讲稿" description="点击按钮后会按页生成讲者备注。" />;
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
  if (!content) return <EmptyState title="尚未生成专家问答" description="默认折叠在汇报辅助区域，不影响主制作流程。" />;
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
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-clinical-900">{value}</p>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
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
