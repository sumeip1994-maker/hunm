"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Suspense } from "react";
import { ArrowLeft, BookOpen, FileText, FileUp, Layers, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { PresentationType } from "@/types";

type TaskMode = "optimize" | "materials" | "topic" | "literature" | "guideline";

const taskModes: { key: TaskMode; title: string; description: string; icon: typeof FileText }[] = [
  { key: "optimize", title: "优化已有PPT", description: "上传现有PPT，进入PPT分析和优化模式。", icon: FileUp },
  { key: "materials", title: "从资料生成PPT", description: "上传PDF、Word、PPT、图片或Excel，自动提炼内容。", icon: FileText },
  { key: "topic", title: "仅输入主题", description: "输入AMD治疗进展、DME病例讨论等主题，先生成内容框架。", icon: Sparkles },
  { key: "literature", title: "文献解读", description: "上传文献PDF，生成文献解读PPT。", icon: BookOpen },
  { key: "guideline", title: "指南解读", description: "上传指南或输入主题，生成指南解读PPT。", icon: Layers },
];

const defaults: Record<TaskMode, { type: PresentationType; title: string; core: string }> = {
  optimize: { type: "custom", title: "PPT优化项目", core: "优化已有医学学术PPT" },
  materials: { type: "case_presentation", title: "资料生成PPT项目", core: "从上传资料生成医学学术PPT" },
  topic: { type: "academic_lecture", title: "主题PPT项目", core: "围绕主题生成医学学术PPT框架" },
  literature: { type: "literature_review", title: "文献解读PPT项目", core: "解读文献并生成学术PPT" },
  guideline: { type: "guideline_review", title: "指南解读PPT项目", core: "解读指南并生成学术PPT" },
};

export default function NewProjectPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8 text-sm text-slate-500">正在加载新建任务...</main>}>
      <NewProjectContent />
    </Suspense>
  );
}

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as TaskMode) || "materials";
  const [mode, setMode] = useState<TaskMode>(taskModes.some((item) => item.key === initialMode) ? initialMode : "materials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("科室医生");
  const [duration, setDuration] = useState(20);
  const [files, setFiles] = useState<File[]>([]);

  const selected = useMemo(() => taskModes.find((item) => item.key === mode) || taskModes[0], [mode]);
  const needsFile = mode !== "topic";

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files || []));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (needsFile && files.length === 0) {
      setError("请先上传资料或PPT。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const preset = defaults[mode];
      const cleanTopic = topic.trim();
      const project = await api.createProject({
        title: cleanTopic || preset.title,
        presentation_type: preset.type,
        audience,
        duration_minutes: duration,
        core_question: cleanTopic || preset.core,
      });
      for (const file of files) {
        await api.uploadDocument(project.id, file);
      }
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-clinical-700">
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-clinical-700">新建任务</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">先选择你要完成的PPT任务</h1>
          <p className="mt-2 text-sm text-slate-600">项目信息可以后续再补充。先上传资料或输入主题，让系统进入对应工作流。</p>

          {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <form onSubmit={onSubmit} className="mt-6">
            <div className="grid gap-3 md:grid-cols-5">
              {taskModes.map((item) => {
                const Icon = item.icon;
                const active = item.key === mode;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`rounded-md border p-4 text-left transition ${active ? "border-clinical-500 bg-clinical-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    onClick={() => setMode(item.key)}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-clinical-700" : "text-slate-500"}`} />
                    <p className="mt-3 text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-base font-semibold text-slate-950">{selected.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{selected.description}</p>

                {needsFile ? (
                  <label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center hover:border-clinical-400">
                    <FileUp className="h-8 w-8 text-clinical-700" />
                    <span className="mt-3 text-sm font-medium text-slate-900">拖拽或点击上传资料</span>
                    <span className="mt-1 text-xs text-slate-500">PDF / DOCX / PPTX / 图片 / Excel</span>
                    <input className="hidden" type="file" multiple accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png,.xlsx,.xls" onChange={onFiles} />
                  </label>
                ) : (
                  <label className="mt-5 block text-sm font-medium text-slate-700">
                    主题
                    <textarea className="input mt-2 min-h-36" placeholder="例如：AMD治疗进展、DME病例讨论、Faricimab真实世界研究" value={topic} onChange={(event) => setTopic(event.target.value)} />
                  </label>
                )}

                {needsFile && files.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {files.map((file) => (
                      <div key={`${file.name}-${file.size}`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        {file.name}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <aside className="rounded-md border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-950">后置项目信息</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">这些信息用于生成PPT风格和内容深度，后续仍可修改。</p>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  主题/项目名
                  <input className="input mt-2" placeholder={defaults[mode].title} value={topic} onChange={(event) => setTopic(event.target.value)} />
                </label>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  目标听众
                  <input className="input mt-2" value={audience} onChange={(event) => setAudience(event.target.value)} />
                </label>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  预计时长
                  <input className="input mt-2" type="number" min={5} max={120} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
                </label>
                <button className="btn-primary mt-5 w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "正在创建..." : "进入工作台"}
                </button>
              </aside>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
