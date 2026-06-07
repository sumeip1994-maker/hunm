"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

import { typeOptions } from "@/components/labels";
import { api } from "@/lib/api/client";
import type { PresentationType } from "@/types";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    presentation_type: "case_presentation" as PresentationType,
    audience: "科室医生",
    duration_minutes: 20,
    core_question: ""
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const project = await api.createProject(form);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-clinical-700">
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>
      <section className="panel p-6">
        <h1 className="text-2xl font-semibold text-clinical-900">新建汇报项目</h1>
        <p className="mt-2 text-sm text-slate-600">第一版面向医生个人使用，先建立项目上下文，再上传资料和生成PPT。</p>
        {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            项目名称
            <input className="input mt-2" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              汇报类型
              <select className="input mt-2" value={form.presentation_type} onChange={(e) => setForm({ ...form, presentation_type: e.target.value as PresentationType })}>
                {typeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              预计时长
              <input className="input mt-2" type="number" min={5} max={120} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            目标听众
            <input className="input mt-2" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            本次最想讨论的问题 / 核心问题
            <textarea className="input mt-2 min-h-28" required value={form.core_question} onChange={(e) => setForm({ ...form, core_question: e.target.value })} />
          </label>
          <button className="btn-primary" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? "正在创建..." : "创建项目"}
          </button>
        </form>
      </section>
    </main>
  );
}
