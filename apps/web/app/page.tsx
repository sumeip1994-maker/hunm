"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpenCheck,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileArchive,
  FileQuestion,
  FileSearch,
  FileText,
  FileUp,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutTemplate,
  Library,
  LogOut,
  MessageSquareText,
  Microscope,
  MoreHorizontal,
  PenLine,
  Search,
  Settings,
  ShieldQuestion,
  Sparkles,
  Trash2,
  Upload,
  UsersRound
} from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { presentationTypeLabels } from "@/components/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api/client";
import type { Project, ProjectStatus } from "@/types";

const creationCards = [
  {
    title: "从资料生成PPT",
    description: "上传病例、文献、指南、图片，AI提炼内容并生成高质量学术PPT",
    action: "开始创建",
    href: "/projects/new?mode=materials",
    icon: Upload,
    tone: "from-violet-100 to-purple-50 text-violet-700 border-violet-200"
  },
  {
    title: "优化已有PPT",
    description: "上传现有PPT，AI自动审稿、补充证据、优化内容和版式",
    action: "上传PPT",
    href: "/projects/new?mode=optimize",
    icon: FileText,
    tone: "from-blue-100 to-sky-50 text-blue-700 border-blue-200"
  },
  {
    title: "专题学术分享",
    description: "输入主题或关键词，AI检索文献并生成完整学术PPT",
    action: "输入主题",
    href: "/projects/new?mode=topic",
    icon: GraduationCap,
    tone: "from-emerald-100 to-teal-50 text-emerald-700 border-emerald-200"
  },
  {
    title: "教学查房",
    description: "创建教学病例演示，包含病例分析、鉴别诊断、治疗方案等",
    action: "开始创建",
    href: "/projects/new?mode=materials",
    icon: UsersRound,
    tone: "from-orange-100 to-amber-50 text-orange-700 border-orange-200"
  },
  {
    title: "专家问答",
    description: "模拟专家提问，提前准备答辩与汇报问答",
    action: "开始问答",
    href: "/projects/1",
    icon: MessageSquareText,
    tone: "from-teal-100 to-cyan-50 text-teal-700 border-teal-200"
  },
  {
    title: "科室数据汇报",
    description: "上传Excel数据，自动生成图表与汇报PPT",
    action: "上传数据",
    href: "/projects/new?mode=materials",
    icon: Boxes,
    tone: "from-pink-100 to-rose-50 text-pink-700 border-pink-200"
  }
];

const navItems = [
  { label: "首页", href: "/", icon: Home, active: true },
  { label: "我的项目", href: "#recent-projects", icon: FolderOpen },
  { label: "资料中心", href: "/projects/1", icon: FileArchive },
  { label: "模板中心", href: "#templates", icon: LayoutTemplate },
  { label: "专家问答", href: "/projects/1", icon: HelpCircle },
  { label: "回收站", href: "#recent-projects", icon: Trash2 }
];

const aiFindings = [
  { title: "缺少指南支持", description: "建议补充 AAO 2024 指南相关内容", action: "去补充", icon: BookOpenCheck, color: "bg-rose-50 text-rose-600" },
  { title: "缺少最新研究", description: "建议补充 2 篇 2024 年最新 RCT 研究", action: "去补充", icon: FileSearch, color: "bg-orange-50 text-orange-600" },
  { title: "逻辑结构优化", description: "建议优化治疗方案对比部分的逻辑结构", action: "去优化", icon: Sparkles, color: "bg-blue-50 text-blue-600" }
];

const advisorTasks = [
  { title: "补充最新文献证据", description: "检索 2024 年最新 RCT 研究", icon: Microscope },
  { title: "完善治疗方案对比", description: "优化不同治疗方案的对比分析", icon: ClipboardList },
  { title: "优化PPT结构", description: "使逻辑更清晰，重点更突出", icon: LayoutTemplate },
  { title: "模拟专家问答", description: "准备可能的专家提问", icon: ShieldQuestion }
];

const quickLinks = [
  { title: "我的模板", href: "#templates", icon: LayoutTemplate },
  { title: "资料中心", href: "/projects/1", icon: FolderOpen },
  { title: "文献检索", href: "/projects/new?mode=literature", icon: Search },
  { title: "历史版本", href: "/projects/1", icon: FileArchive },
  { title: "回收站", href: "#recent-projects", icon: Trash2 }
];

const statusProgress: Record<ProjectStatus, number> = {
  draft: 25,
  uploaded: 40,
  analyzed: 55,
  outline_ready: 70,
  ppt_ready: 90,
  reviewed: 100
};

const featuredFallback = {
  title: "DME病例讨论",
  tag: "病例讨论",
  updated: "更新于 2小时前",
  progress: 65
};

function formatChineseDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function projectProgress(project: Project) {
  return statusProgress[project.status] ?? 40;
}

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

  const recentProjects = useMemo(() => projects.slice(0, 4), [projects]);
  const featuredProject = recentProjects[0];

  return (
    <main className="min-h-screen bg-[#f7f8fe] text-slate-950">
      <div className="grid min-h-screen grid-cols-[220px_minmax(0,1fr)_240px] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="sticky top-0 flex h-screen flex-col border-r border-slate-200 bg-white/90 px-5 py-6 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#4d35d9] text-white shadow-lg shadow-violet-200">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold tracking-normal">Medical Presentation Studio</p>
              <p className="text-xs font-medium text-slate-500">医学学术PPT工作台</p>
            </div>
          </Link>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? "bg-violet-50 text-[#6236df] shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-[#6236df]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <section className="mt-auto rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[#6236df]">
              <Sparkles className="h-4 w-4" />
              <p className="font-semibold">AI 学术顾问</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">我是您的AI学术顾问，可以为您提供：</p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
              <li>· 内容分析与建议</li>
              <li>· 文献检索与补充</li>
              <li>· PPT优化与审稿</li>
              <li>· 专家问答模拟</li>
            </ul>
            <Link href="/model-integration" className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#6236df] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-[#4f28c8]">
              立即咨询
            </Link>
          </section>

          <div className="mt-6 text-xs leading-6 text-slate-400">
            <p>© 2026 Medical Studio</p>
            <p>v2.0.0</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/85 px-8 backdrop-blur">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#7c5cff] focus:ring-4 focus:ring-violet-100" placeholder="搜索项目、资料、文献、模板等..." />
            </div>
            <div className="flex items-center gap-3">
              <Link href="/projects/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#6236df] px-4 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-[#4f28c8]">
                <PenLine className="h-4 w-4" />
                新建汇报
              </Link>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:text-[#6236df]" aria-label="帮助">
                <CircleHelp className="h-5 w-5" />
              </button>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:text-[#6236df]" aria-label="通知">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">3</span>
              </button>
              <div className="relative">
                <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-700">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-violet-100 text-sm font-bold text-[#6236df]">张</span>
                  张医生
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
                  {[
                    { label: "个人中心", icon: UsersRound },
                    { label: "系统设置", icon: Settings, active: true },
                    { label: "模板中心", icon: LayoutTemplate },
                    { label: "帮助中心", icon: HelpCircle },
                    { label: "退出登录", icon: LogOut }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.label} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${item.active ? "bg-violet-50 text-[#6236df]" : "text-slate-600 hover:bg-slate-50"}`}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </header>

          <div className="px-8 py-8">
            <section className="relative overflow-hidden rounded-[28px] border border-white bg-white px-8 py-8 shadow-sm">
              <div className="absolute right-10 top-0 h-52 w-[460px] rounded-b-[48px] bg-gradient-to-br from-violet-100 via-white to-blue-50 opacity-95" />
              <div className="absolute right-24 top-9 hidden h-28 w-80 rounded-3xl border border-violet-100 bg-white/45 shadow-inner md:block">
                <div className="absolute left-8 top-8 h-12 w-12 rounded-full bg-violet-200" />
                <div className="absolute left-28 top-12 h-5 w-32 rounded-full bg-[#6236df]" />
                <div className="absolute right-14 top-8 h-16 w-16 rounded-full border-[10px] border-violet-200" />
                <div className="absolute bottom-5 right-8 h-12 w-12 rounded-full border-[8px] border-blue-200" />
              </div>
              <div className="relative">
                <h1 className="text-3xl font-bold tracking-normal text-slate-950">欢迎回来，张医生 👋</h1>
                <p className="mt-3 text-base text-slate-600">今天是 {formatChineseDate(new Date())}，祝您工作顺利！</p>
              </div>
            </section>

            {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

            <section className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">继续上次的工作</h2>
                <div className="mt-6 flex items-center gap-5">
                  <div className="h-28 w-20 overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 via-violet-100 to-indigo-200 p-2 shadow-inner">
                    <div className="h-full rounded-md bg-white/55 p-2">
                      <div className="h-2 w-9 rounded-full bg-slate-300" />
                      <div className="mt-12 h-8 rounded bg-gradient-to-r from-[#6236df] to-[#e33b8b]" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate text-xl font-bold">{featuredProject?.title || featuredFallback.title}</h3>
                      <span className="rounded-md bg-violet-50 px-2.5 py-1 text-xs font-bold text-[#6236df]">{featuredProject ? presentationTypeLabels[featuredProject.presentation_type] : featuredFallback.tag}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">{featuredProject ? `更新于 ${new Date(featuredProject.updated_at).toLocaleString("zh-CN")}` : featuredFallback.updated}</p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-600">完成度 {featuredProject ? projectProgress(featuredProject) : featuredFallback.progress}%</span>
                      <div className="h-2 w-44 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#6236df]" style={{ width: `${featuredProject ? projectProgress(featuredProject) : featuredFallback.progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <Link href={featuredProject ? `/projects/${featuredProject.id}` : "/projects/new?mode=materials"} className="inline-flex items-center gap-2 rounded-lg bg-[#6236df] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-[#4f28c8]">
                    <FileText className="h-4 w-4" />
                    继续编辑
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">AI 发现</h2>
                  <Sparkles className="h-4 w-4 text-[#6236df]" />
                </div>
                <p className="mt-3 text-sm text-slate-500">基于您当前项目，AI 发现以下可优化点：</p>
                <div className="mt-5 space-y-3">
                  {aiFindings.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800">{item.title}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{item.description}</p>
                        </div>
                        <Link href="/projects/1" className="text-sm font-bold text-[#6236df]">{item.action}</Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section id="templates" className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-bold">新建学术汇报</h2>
                <p className="mt-2 text-sm text-slate-500">选择适合的场景，AI 将为您提供全流程支持</p>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3 2xl:grid-cols-6">
                {creationCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Link key={card.title} href={card.href} className="group flex min-h-64 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/70">
                      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border bg-gradient-to-br ${card.tone}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <h3 className="mt-5 text-base font-bold">{card.title}</h3>
                      <p className="mt-3 flex-1 text-xs leading-6 text-slate-500">{card.description}</p>
                      <span className="mt-5 inline-flex items-center justify-center rounded-lg border border-current px-4 py-2 text-sm font-bold text-[#6236df] transition group-hover:bg-[#6236df] group-hover:text-white">
                        {card.action}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section id="recent-projects" className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">最近项目</h2>
                <a href="#recent-projects" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-[#6236df]">
                  查看全部
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">正在加载项目...</div> : null}
              {!loading && recentProjects.length === 0 ? <EmptyState title="还没有最近项目" description="从上方选择一个任务开始制作医学PPT。" /> : null}
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
                {recentProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-4">
                      <div className="h-24 w-20 shrink-0 rounded-lg bg-gradient-to-br from-slate-100 via-violet-50 to-blue-100 p-2">
                        <div className="h-full rounded-md bg-white/70 p-2">
                          <div className="h-2 w-8 rounded-full bg-slate-300" />
                          <div className="mt-10 h-6 rounded bg-[#6236df]/70" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-sm font-bold leading-5">{project.title}</h3>
                          <StatusBadge status={project.status} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{presentationTypeLabels[project.presentation_type]}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>完成度 {projectProgress(project)}%</span>
                            <button className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => deleteProject(project)} aria-label="删除项目">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-[#6236df]" style={{ width: `${projectProgress(project)}%` }} />
                          </div>
                        </div>
                        <Link href={`/projects/${project.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#6236df]">
                          进入工作台
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="px-2 text-lg font-bold">快捷入口</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} href={item.href} className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-[#6236df]">
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </section>

        <aside className="sticky top-0 flex h-screen flex-col border-l border-slate-200 bg-white px-4 py-6">
          <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-lg shadow-violet-100/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#6236df]">
                <Sparkles className="h-4 w-4" />
                AI 学术顾问
              </div>
              <button className="text-xs font-semibold text-[#6236df]">收起</button>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm leading-6 text-slate-600">基于您当前的 DME 病例讨论项目，我可以帮助您：</p>
              <div className="mt-4 space-y-4">
                {advisorTasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <div key={task.title} className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[#6236df]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{task.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{task.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Link href="/model-integration" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6236df] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-[#4f28c8]">
              <Sparkles className="h-4 w-4" />
              开始咨询
            </Link>
            <div className="mt-3 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
              <span className="flex-1">输入您的问题...</span>
              <MoreHorizontal className="h-4 w-4" />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
