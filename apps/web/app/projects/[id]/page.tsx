"use client";

import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Bot, Download, FileUp, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { presentationTypeLabels } from "@/components/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { api, apiBaseUrl } from "@/lib/api/client";
import type { Artifact, DocumentItem, Project } from "@/types";

type TabKey = "overview" | "documents" | "analysis" | "planning" | "ppt" | "review" | "qa" | "script";

interface OutlineContent {
  sections: { title: string; level: number }[];
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "项目概览" },
  { key: "documents", label: "资料中心" },
  { key: "analysis", label: "AI分析" },
  { key: "planning", label: "汇报规划" },
  { key: "ppt", label: "PPT生成" },
  { key: "review", label: "PPT审稿" },
  { key: "qa", label: "专家问答" },
  { key: "script", label: "讲稿" }
];

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
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
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy("upload");
    setError("");
    try {
      await api.uploadDocument(projectId, file);
      await refresh();
      event.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setBusy("");
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

  if (loading) return <main className="min-h-screen p-8 text-sm text-slate-500">正在加载项目工作区...</main>;
  if (!project) return <main className="min-h-screen p-8 text-sm text-red-700">项目不存在或加载失败</main>;

  const analysis = latest.get("analysis_report")?.content_json;
  const directions = latest.get("direction_recommendation")?.content_json;
  const outline = latest.get("outline")?.content_json as OutlineContent | undefined;
  const review = latest.get("review_report")?.content_json;
  const qa = latest.get("qa_report")?.content_json;
  const script = latest.get("script")?.content_json;

  return (
    <main className="min-h-screen bg-clinical-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm text-clinical-700">医学学术汇报工作台</p>
            <h1 className="mt-1 text-2xl font-semibold text-clinical-900">{project.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {presentationTypeLabels[project.presentation_type]} · {project.audience} · {project.duration_minutes}分钟
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[220px_1fr_280px]">
        <aside className="panel h-fit p-2">
          {tabs.map((tab) => (
            <button key={tab.key} className={`w-full rounded-md px-3 py-2 text-left text-sm ${activeTab === tab.key ? "bg-clinical-700 text-white" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </aside>

        <section className="space-y-4">
          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          {activeTab === "overview" ? (
            <Panel title="项目概览">
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="已上传资料" value={String(documents.length)} />
                <Metric label="已生成Artifact" value={String(artifacts.length)} />
                <Metric label="当前状态" value={project.status} />
              </div>
              <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-900">下一步建议</p>
                <p className="mt-2">先上传病例、文献或已有PPT，再进入 AI分析 生成资料摘要和汇报重点。</p>
                <p className="mt-2">核心问题：{project.core_question}</p>
              </div>
            </Panel>
          ) : null}

          {activeTab === "documents" ? (
            <Panel title="资料中心">
              <label className="btn-primary w-fit cursor-pointer">
                <FileUp className="h-4 w-4" />
                {busy === "upload" ? "正在上传..." : "上传资料"}
                <input className="hidden" type="file" accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png,.xlsx" onChange={onUpload} disabled={busy === "upload"} />
              </label>
              <div className="mt-5 space-y-3">
                {documents.length === 0 ? <EmptyState title="还没有资料" description="支持 pdf、pptx、docx、jpg、png、xlsx，单文件默认不超过50MB。" /> : null}
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-md border border-slate-200 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{doc.original_filename}</p>
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{doc.file_type}</span>
                    </div>
                    <p className="mt-2 text-slate-500">
                      {doc.document_category} · {(doc.file_size / 1024).toFixed(1)} KB · {new Date(doc.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {activeTab === "analysis" ? (
            <Panel title="AI分析">
              <ActionButton busy={busy === "analyze"} onClick={() => run("analyze", "analyze")} label="开始AI分析" />
              {analysis ? (
                <ResultBlock
                  items={[
                    ["资料摘要", String(analysis.summary || "")],
                    ["关键问题", asList(analysis.key_questions).join(" / ")],
                    ["学术价值", String(analysis.academic_value || "")],
                    ["教学价值", String(analysis.teaching_value || "")],
                    ["可能的汇报重点", asList(analysis.suggested_focus).join(" / ")],
                    ["风险提示", asList(analysis.risk_notes).join(" / ")]
                  ]}
                />
              ) : (
                <EmptyState title="尚未生成分析" description="点击按钮后会保存 analysis_report Artifact。" />
              )}
            </Panel>
          ) : null}

          {activeTab === "planning" ? (
            <Panel title="汇报规划">
              <div className="flex flex-wrap gap-3">
                <ActionButton busy={busy === "directions"} onClick={() => run("directions", "directions")} label="生成汇报方向" />
                <ActionButton busy={busy === "outline"} onClick={() => run("outline", "outline")} label="生成目录" />
              </div>
              <Directions content={directions} />
              <EditableOutline outline={outline} />
            </Panel>
          ) : null}

          {activeTab === "ppt" ? (
            <Panel title="PPT生成">
              <button className="btn-primary" onClick={generatePpt} disabled={busy === "ppt"}>
                {busy === "ppt" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy === "ppt" ? "正在生成..." : "生成PPT"}
              </button>
              {downloadUrl ? (
                <a className="btn-secondary mt-4 w-fit" href={downloadUrl}>
                  <Download className="h-4 w-4" />
                  下载PPTX
                </a>
              ) : (
                <p className="mt-4 text-sm text-slate-600">生成后会在这里显示下载按钮。</p>
              )}
            </Panel>
          ) : null}

          {activeTab === "review" ? (
            <Panel title="PPT审稿">
              <ActionButton busy={busy === "review"} onClick={() => run("review", "review")} label="生成审稿建议" />
              <ReviewView content={review} />
            </Panel>
          ) : null}
          {activeTab === "qa" ? (
            <Panel title="专家问答">
              <ActionButton busy={busy === "qa"} onClick={() => run("qa", "qa")} label="生成专家问题" />
              <QAView content={qa} />
            </Panel>
          ) : null}
          {activeTab === "script" ? (
            <Panel title="讲稿">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select className="input w-40" value={scriptDuration} onChange={(e) => setScriptDuration(Number(e.target.value))}>
                  <option value={10}>10分钟版</option>
                  <option value={20}>20分钟版</option>
                  <option value={30}>30分钟版</option>
                </select>
                <ActionButton busy={busy === "script"} onClick={() => run("script", "script", `?duration=${scriptDuration}`)} label="生成讲稿" />
              </div>
              <ScriptView content={script} />
            </Panel>
          ) : null}
        </section>

        <aside className="panel h-fit p-5">
          <div className="flex items-center gap-2 text-clinical-900">
            <Bot className="h-5 w-5" />
            <h2 className="font-semibold">AI 助手提示</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>已支持阿里云百炼接入；未配置密钥时会使用 mock 数据。</p>
            <p>建议先补齐资料，再依次生成分析、方向、目录和PPT。</p>
            <p>请确保病例资料完成脱敏，不在汇报中输出诊疗决策建议。</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <h2 className="mb-4 text-lg font-semibold text-clinical-900">{title}</h2>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-clinical-900">{value}</p>
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

function ResultBlock({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-5 grid gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border border-slate-200 p-4 text-sm">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="mt-2 text-slate-600">{value || "暂无内容"}</p>
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
          <div key={index} className="rounded-md border border-slate-200 p-4 text-sm">
            <p className="font-semibold text-slate-900">{String(direction.name || "")}</p>
            <p className="mt-2 text-slate-600">{String(direction.scenario || "")}</p>
            <p className="mt-2 text-slate-600">{String(direction.reason || "")}</p>
            <p className="mt-2 text-slate-500">{asList(direction.structure).join(" / ")}</p>
          </div>
        );
      })}
    </div>
  );
}

function EditableOutline({ outline }: { outline: OutlineContent | undefined }) {
  const [sections, setSections] = useState(outline?.sections ?? []);

  useEffect(() => {
    setSections(outline?.sections ?? []);
  }, [outline]);

  if (!outline) return <EmptyState title="尚未生成目录" description="生成目录后可在前端进行基础编辑。" />;

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm font-medium text-slate-900">目录编辑</p>
      {sections.map((section, index) => (
        <div key={index} className="flex gap-2">
          <input className="input" value={section.title} onChange={(e) => setSections(sections.map((item, idx) => (idx === index ? { ...item, title: e.target.value } : item)))} />
          <button className="btn-secondary aspect-square px-2" onClick={() => setSections(sections.filter((_, idx) => idx !== index))} aria-label="删除章节">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button className="btn-secondary" onClick={() => setSections([...sections, { title: "新增章节", level: 1 }])}>
        <Plus className="h-4 w-4" />
        新增章节
      </button>
    </div>
  );
}

function ReviewView({ content }: { content: Record<string, unknown> | undefined }) {
  if (!content) return <EmptyState title="尚未生成审稿建议" description="点击按钮后会按学术性、逻辑、证据和视觉表达给出修改建议。" />;
  const scores = [
    ["学术性", content.academic_score],
    ["逻辑性", content.logic_score],
    ["证据支撑", content.evidence_score],
    ["视觉表达", content.visual_score],
  ];
  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {scores.map(([label, value]) => (
          <Metric key={String(label)} label={String(label)} value={`${String(value || "-")}分`} />
        ))}
      </div>
      <ListCard title="主要问题" items={asList(content.issues)} />
      <ListCard title="修改建议" items={asList(content.suggestions)} />
      <ListCard title="优先处理" items={asList(content.priority_fixes)} />
    </div>
  );
}

function QAView({ content }: { content: Record<string, unknown> | undefined }) {
  if (!content) return <EmptyState title="尚未生成专家问答" description="点击按钮后会生成主任、专家和方法学角度的追问。" />;
  return (
    <div className="mt-5 grid gap-3">
      <ListCard title="主任可能会问" items={asList(content.director_questions)} />
      <ListCard title="专家可能会问" items={asList(content.expert_questions)} />
      <ListCard title="方法学追问" items={asList(content.methodology_questions)} />
      <ListCard title="回答思路" items={asList(content.reference_answers)} />
    </div>
  );
}

function ScriptView({ content }: { content: Record<string, unknown> | undefined }) {
  if (!content) return <EmptyState title="尚未生成讲稿" description="点击按钮后会按页生成讲稿、预计用时和转场句。" />;
  const slides = Array.isArray(content.slides) ? content.slides : [];
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-md border border-slate-200 p-4 text-sm">
        <p className="font-medium text-slate-900">开场</p>
        <p className="mt-2 leading-6 text-slate-600">{String(content.opening || "")}</p>
      </div>
      {slides.map((item, index) => {
        const slide = item as Record<string, unknown>;
        return (
          <div key={index} className="rounded-md border border-slate-200 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">
                {String(slide.slide_no || index + 1)}. {String(slide.title || "")}
              </p>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{String(slide.estimated_time || "")}</span>
            </div>
            <p className="mt-3 leading-6 text-slate-700">{String(slide.script || "")}</p>
            <p className="mt-3 text-slate-500">转场：{String(slide.transition || "")}</p>
          </div>
        );
      })}
      <div className="rounded-md border border-slate-200 p-4 text-sm">
        <p className="font-medium text-slate-900">结尾</p>
        <p className="mt-2 leading-6 text-slate-600">{String(content.closing || "")}</p>
      </div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-slate-200 p-4 text-sm">
      <p className="font-medium text-slate-900">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-2 text-slate-600">
          {items.map((item, index) => (
            <li key={index} className="leading-6">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-slate-500">暂无内容</p>
      )}
    </div>
  );
}
