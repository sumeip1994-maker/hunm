"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, FileText, FileUp, Layers, PlugZap, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { presentationTypeLabels } from "@/components/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api/client";
import type { Project } from "@/types";

const taskCards = [
  {
    title: "从资料生成PPT",
    description: "上传病例、文献、指南、图片等资料，自动生成学术PPT。",
    action: "开始创建",
    href: "/projects/new?mode=materials",
    icon: FileText,
  },
  {
    title: "优化已有PPT",
    description: "上传现有PPT，自动审稿、补充内容、优化版式。",
    action: "上传PPT",
    href: "/projects/new?mode=optimize",
    icon: FileUp,
  },
  {
    title: "文献解读",
    description: "上传文献PDF，自动生成文献解读PPT。",
    action: "解读文献",
    href: "/projects/new?mode=literature",
    icon: BookOpen,
  },
  {
    title: "指南解读",
    description: "上传指南或输入主题，生成指南解读PPT。",
    action: "生成指南PPT",
    href: "/projects/new?mode=guideline",
    icon: Layers,
  },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      setProjects(await api.listProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : "项目加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`确认删除“${project.title}”？删除后资料、PPT和版本记录都会移除。`)) return;
    setError("");
    try {
      await api.deleteProject(project.id);
      setProjects((items) => items.filter((item) => item.id !== project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-clinical-700">Medical Presentation Studio V2</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">医生学术PPT工作台</h1>
            <p className="mt-3 max-w-2xl text-slate-600">从资料、文献、指南或已有PPT出发，快速制作高质量医学学术PPT。</p>
          </div>
          <Link href="/model-integration" className="btn-secondary">
            <PlugZap className="h-4 w-4" />
            AI能力中心
          </Link>
        </header>

        {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <section>
          <h2 className="text-xl font-semibold tracking-normal text-slate-950">今天想完成什么？</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {taskCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="group rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-clinical-300 hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-clinical-50 text-clinical-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-950">{card.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{card.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-clinical-700">
                    {card.action}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-normal text-slate-950">最近项目</h2>
            <p className="text-sm text-slate-500">{projects.length} 个项目</p>
          </div>

          {loading ? <div className="panel mt-4 p-6 text-sm text-slate-500">正在加载项目...</div> : null}
          {!loading && projects.length === 0 ? <EmptyState title="还没有最近项目" description="从上方选择一个任务开始制作医学PPT。" /> : null}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <article key={project.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{project.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {presentationTypeLabels[project.presentation_type]} · {project.audience}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <p className="mt-4 text-sm text-slate-500">创建时间：{new Date(project.created_at).toLocaleString("zh-CN")}</p>
                <div className="mt-5 flex gap-3">
                  <Link href={`/projects/${project.id}`} className="btn-secondary flex-1">
                    进入工作台
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button className="btn-secondary aspect-square px-2 text-red-600 hover:border-red-200 hover:bg-red-50" onClick={() => deleteProject(project)} aria-label="删除项目">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
