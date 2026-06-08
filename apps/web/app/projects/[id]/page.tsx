"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Circle, Download, FileUp, Loader2, PlugZap, Plus, Sparkles, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { presentationTypeLabels } from "@/components/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { api, apiBaseUrl } from "@/lib/api/client";
import type { Artifact, DocumentItem, Project } from "@/types";

type StepKey = "documents" | "analysis" | "directions" | "outline" | "ppt" | "review" | "qa";

interface OutlineContent {
  sections: { title: string; level: number }[];
}

const workflowSteps: { key: StepKey; label: string; hint: string }[] = [
  { key: "documents", label: "上传资料", hint: "病例、文献、旧PPT" },
  { key: "analysis", label: "AI分析", hint: "提炼问题与证据" },
  { key: "directions", label: "汇报方向", hint: "确定叙事路径" },
  { key: "outline", label: "目录确认", hint: "编辑页面结构" },
  { key: "ppt", label: "PPT生成", hint: "生成并下载文件" },
  { key: "review", label: "审稿", hint: "学术与视觉优化" },
  { key: "qa", label: "专家问答", hint: "准备追问与回答" },
];

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [activeStep, setActiveStep] = useState<StepKey>("documents");
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

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

  async function run(name: string, action: string, nextStep?: StepKey) {
    setBusy(name);
    setError("");
    try {
      await api.runArtifact(projectId, action);
      await refresh();
      if (nextStep) setActiveStep(nextStep);
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
      setActiveStep("review");
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

  const completed = {
    documents: documents.length > 0,
    analysis: Boolean(analysis),
    directions: Boolean(directions),
    outline: Boolean(outline),
    ppt: project.status === "ppt_ready" || project.status === "reviewed" || Boolean(downloadUrl),
    review: Boolean(review),
    qa: Boolean(qa),
  };

  const activeIndex = workflowSteps.findIndex((step) => step.key === activeStep);
  const activeMeta = workflowSteps[activeIndex] || workflowSteps[0];

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-medium text-clinical-700">医学学术汇报工作台</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{project.title}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {presentationTypeLabels[project.presentation_type]} · {project.audience} · {project.duration_minutes}分钟 · 核心问题：{project.core_question}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/model-integration" className="btn-secondary">
                <PlugZap className="h-4 w-4" />
                模型接入
              </Link>
              <StatusBadge status={project.status} />
            </div>
          </div>

          <WorkflowStepper activeStep={activeStep} completed={completed} onChange={setActiveStep} />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-sm font-medium text-clinical-700">Step {activeIndex + 1}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">{activeMeta.label}</h2>
              <p className="mt-2 text-sm text-slate-500">{activeMeta.hint}</p>
            </div>

            <div className="px-6 py-5">
              {activeStep === "documents" ? (
                <DocumentsStep documents={documents} busy={busy} onUpload={onUpload} onNext={() => setActiveStep("analysis")} canContinue={completed.documents} />
              ) : null}

              {activeStep === "analysis" ? (
                <AnalysisStep analysis={analysis} busy={busy} onRun={() => run("analyze", "analyze", "directions")} />
              ) : null}

              {activeStep === "directions" ? (
                <DirectionsStep directions={directions} busy={busy} onRun={() => run("directions", "directions", "outline")} onNext={() => setActiveStep("outline")} />
              ) : null}

              {activeStep === "outline" ? (
                <OutlineStep outline={outline} busy={busy} onRun={() => run("outline", "outline")} onNext={() => setActiveStep("ppt")} />
              ) : null}

              {activeStep === "ppt" ? (
                <PptStep busy={busy} downloadUrl={downloadUrl} onGenerate={generatePpt} />
              ) : null}

              {activeStep === "review" ? (
                <ReviewStep review={review} busy={busy} onRun={() => run("review", "review", "qa")} />
              ) : null}

              {activeStep === "qa" ? (
                <QAStep qa={qa} busy={busy} onRun={() => run("qa", "qa")} />
              ) : null}
            </div>
          </div>
        </section>

        <AcademicAdvisor project={project} documents={documents} completed={completed} activeStep={activeStep} />
      </div>
    </main>
  );
}

function WorkflowStepper({
  activeStep,
  completed,
  onChange,
}: {
  activeStep: StepKey;
  completed: Record<StepKey, boolean>;
  onChange: (step: StepKey) => void;
}) {
  return (
    <nav className="mt-5 grid gap-2 lg:grid-cols-7">
      {workflowSteps.map((step, index) => {
        const active = activeStep === step.key;
        const done = completed[step.key];
        return (
          <button
            key={step.key}
            className={`min-h-[76px] rounded-md border px-3 py-3 text-left transition ${
              active ? "border-clinical-500 bg-clinical-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
            onClick={() => onChange(step.key)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-medium ${active ? "text-clinical-700" : "text-slate-500"}`}>0{index + 1}</span>
              {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-950">{step.label}</p>
            <p className="mt-1 text-xs text-slate-500">{step.hint}</p>
          </button>
        );
      })}
    </nav>
  );
}

function DocumentsStep({
  documents,
  busy,
  onUpload,
  onNext,
  canContinue,
}: {
  documents: DocumentItem[];
  busy: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="btn-primary w-fit cursor-pointer">
          <FileUp className="h-4 w-4" />
          {busy === "upload" ? "正在上传..." : "上传资料"}
          <input className="hidden" type="file" accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png,.xlsx" onChange={onUpload} disabled={busy === "upload"} />
        </label>
        <button className="btn-secondary" onClick={onNext} disabled={!canContinue}>
          进入AI分析
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        {documents.length === 0 ? <EmptyState title="先上传材料" description="支持 pdf、pptx、docx、jpg、png、xlsx。上传后 AI 会围绕资料提炼汇报价值和结构。" /> : null}
        {documents.map((doc) => (
          <div key={doc.id} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-900">{doc.original_filename}</p>
              <span className="rounded bg-white px-2 py-1 text-xs text-slate-600">{doc.file_type}</span>
            </div>
            <p className="mt-2 text-slate-500">
              {doc.document_category} · {(doc.file_size / 1024).toFixed(1)} KB · {new Date(doc.created_at).toLocaleString("zh-CN")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisStep({ analysis, busy, onRun }: { analysis: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <ActionButton busy={busy === "analyze"} onClick={onRun} label={analysis ? "重新AI分析" : "开始AI分析"} />
      {analysis ? (
        <ResultBlock
          items={[
            ["资料摘要", String(analysis.summary || "")],
            ["关键问题", asList(analysis.key_questions).join(" / ")],
            ["学术价值", String(analysis.academic_value || "")],
            ["教学价值", String(analysis.teaching_value || "")],
            ["可能的汇报重点", asList(analysis.suggested_focus).join(" / ")],
            ["风险提示", asList(analysis.risk_notes).join(" / ")],
          ]}
        />
      ) : (
        <EmptyState title="等待AI分析" description="AI 会先帮你判断资料能支撑什么、哪些内容适合进入学术汇报。" />
      )}
    </div>
  );
}

function DirectionsStep({
  directions,
  busy,
  onRun,
  onNext,
}: {
  directions: Record<string, unknown> | undefined;
  busy: string;
  onRun: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <ActionButton busy={busy === "directions"} onClick={onRun} label={directions ? "重新生成方向" : "生成汇报方向"} />
        <button className="btn-secondary" onClick={onNext} disabled={!directions}>
          确认方向
        </button>
      </div>
      <Directions content={directions} />
      {!directions ? <EmptyState title="尚未生成汇报方向" description="AI 会给出问题驱动、证据整合或教学查房等不同叙事路径。" /> : null}
    </div>
  );
}

function OutlineStep({
  outline,
  busy,
  onRun,
  onNext,
}: {
  outline: OutlineContent | undefined;
  busy: string;
  onRun: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <ActionButton busy={busy === "outline"} onClick={onRun} label={outline ? "重新生成目录" : "生成目录"} />
        <button className="btn-secondary" onClick={onNext} disabled={!outline}>
          目录确认
        </button>
      </div>
      <EditableOutline outline={outline} />
    </div>
  );
}

function PptStep({ busy, downloadUrl, onGenerate }: { busy: string; downloadUrl: string; onGenerate: () => void }) {
  return (
    <div>
      <button className="btn-primary" onClick={onGenerate} disabled={busy === "ppt"}>
        {busy === "ppt" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy === "ppt" ? "正在生成..." : "生成PPT"}
      </button>
      {downloadUrl ? (
        <a className="btn-secondary mt-4 w-fit" href={downloadUrl}>
          <Download className="h-4 w-4" />
          下载PPTX
        </a>
      ) : (
        <EmptyState title="等待生成PPT" description="确认目录后生成PPTX，之后进入审稿步骤优化逻辑、证据和视觉表达。" />
      )}
    </div>
  );
}

function ReviewStep({ review, busy, onRun }: { review: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <ActionButton busy={busy === "review"} onClick={onRun} label={review ? "重新审稿" : "生成审稿建议"} />
      <ReviewView content={review} />
    </div>
  );
}

function QAStep({ qa, busy, onRun }: { qa: Record<string, unknown> | undefined; busy: string; onRun: () => void }) {
  return (
    <div>
      <ActionButton busy={busy === "qa"} onClick={onRun} label={qa ? "重新生成问答" : "生成专家问答"} />
      <QAView content={qa} />
    </div>
  );
}

function AcademicAdvisor({
  project,
  documents,
  completed,
  activeStep,
}: {
  project: Project;
  documents: DocumentItem[];
  completed: Record<StepKey, boolean>;
  activeStep: StepKey;
}) {
  const nextAdvice: Record<StepKey, string> = {
    documents: "先放入病例、文献、指南或旧PPT。资料越完整，后续AI分析越贴近真实场景。",
    analysis: "重点看AI是否抓住核心问题、证据边界和学术价值。如果偏题，先补资料再重跑。",
    directions: "选择最适合听众的叙事路径。主任查房、科室教学和学术会议的组织方式不一样。",
    outline: "确认每一页只承担一个任务：引入问题、呈现证据、解释局限或收束观点。",
    ppt: "生成PPT后先看结构，再看视觉。不要急着逐字修改，先确认整套逻辑顺不顺。",
    review: "审稿建议优先处理证据来源、结论边界和页面拥挤问题。",
    qa: "专家问答不是背答案，而是提前准备证据来源、适用范围、局限性和后续计划。",
  };

  return (
    <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-clinical-900">
        <Bot className="h-5 w-5" />
        <h2 className="font-semibold">AI 学术顾问</h2>
      </div>
      <div className="mt-5 space-y-4 text-sm">
        <div>
          <p className="text-slate-500">当前建议</p>
          <p className="mt-2 leading-6 text-slate-700">{nextAdvice[activeStep]}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="font-medium text-slate-900">项目上下文</p>
          <p className="mt-2 text-slate-600">{presentationTypeLabels[project.presentation_type]} · {project.audience}</p>
          <p className="mt-1 text-slate-600">{project.duration_minutes}分钟</p>
        </div>
        <div>
          <p className="font-medium text-slate-900">资料状态</p>
          <p className="mt-2 text-slate-600">已上传 {documents.length} 份资料</p>
        </div>
        <div className="grid gap-2">
          {workflowSteps.map((step) => (
            <div key={step.key} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600">{step.label}</span>
              <span className={completed[step.key] ? "text-emerald-600" : "text-slate-400"}>{completed[step.key] ? "已完成" : "待处理"}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
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

  useEffect(() => {
    setSections(outline?.sections ?? []);
  }, [outline]);

  if (!outline) return <EmptyState title="尚未生成目录" description="生成后可在这里逐页确认标题和顺序。" />;

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm font-medium text-slate-900">目录确认</p>
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
