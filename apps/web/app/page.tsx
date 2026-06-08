"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, PlugZap, Plus } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { presentationTypeLabels } from "@/components/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api/client";
import type { Project } from "@/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listProjects()
      .then(setProjects)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-clinical-700">Medical Presentation Studio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-clinical-900">医学学术汇报工作台</h1>
          <p className="mt-3 text-slate-600">从资料到PPT，一站式完成医学学术汇报</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/model-integration" className="btn-secondary">
            <PlugZap className="h-4 w-4" />
            模型接入
          </Link>
          <Link href="/projects/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            新建项目
          </Link>
        </div>
      </header>

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="panel p-6 text-sm text-slate-500">正在加载项目...</div> : null}
      {!loading && projects.length === 0 ? <EmptyState title="还没有项目" description="创建第一个汇报项目后，资料、目录和PPT都会围绕项目组织。" /> : null}

      <section className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article key={project.id} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{project.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {presentationTypeLabels[project.presentation_type]} · {project.audience}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-4 text-sm text-slate-500">创建时间：{new Date(project.created_at).toLocaleString("zh-CN")}</p>
            <Link href={`/projects/${project.id}`} className="btn-secondary mt-5 w-full">
              进入项目
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
