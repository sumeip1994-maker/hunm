"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, PlugZap, Save, Sparkles } from "lucide-react";

import { api } from "@/lib/api/client";
import type { LLMStatus, LLMTestResult } from "@/types";

export default function ModelIntegrationPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("qwen-plus");
  const [baseUrl, setBaseUrl] = useState("https://dashscope.aliyuncs.com/compatible-mode/v1");
  const [status, setStatus] = useState<LLMStatus | null>(null);
  const [testResult, setTestResult] = useState<LLMTestResult | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setBusy("status");
    setError("");
    try {
      const data = await api.getLLMStatus();
      setStatus(data);
      setModel(data.model || "qwen-plus");
      setBaseUrl(data.base_url || "https://dashscope.aliyuncs.com/compatible-mode/v1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取接入状态失败");
    } finally {
      setBusy("");
    }
  }

  async function saveConfig() {
    setBusy("save");
    setError("");
    setSaved("");
    try {
      const data = await api.saveLLMConfig({ api_key: apiKey, model, base_url: baseUrl });
      setStatus(data);
      setSaved("API Key 已保存到服务器。");
      setApiKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy("");
    }
  }

  async function testConnection() {
    setBusy("test");
    setError("");
    setSaved("");
    try {
      setTestResult(await api.testLLM());
      setStatus(await api.getLLMStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "测试失败");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-clinical-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-clinical-700">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
            <p className="text-sm font-medium text-clinical-700">全局配置</p>
            <h1 className="mt-2 text-3xl font-semibold text-clinical-900">模型接入</h1>
            <p className="mt-3 text-slate-600">配置阿里云百炼 / DashScope 兼容接口，保存后所有项目共用。</p>
          </div>
          <div className={`rounded-md border px-3 py-2 text-sm ${status?.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            {status?.enabled ? "已配置" : "未配置"}
          </div>
        </header>

        {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {saved ? <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{saved}</div> : null}

        <section className="panel p-5">
          <div className="flex items-center gap-2 text-clinical-900">
            <PlugZap className="h-5 w-5" />
            <h2 className="text-lg font-semibold">API Key 输入</h2>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-900">DashScope API Key</span>
              <div className="flex gap-2">
                <input className="input" type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-..." autoComplete="off" />
                <button className="btn-secondary aspect-square px-2" type="button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "隐藏 API Key" : "显示 API Key"}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-900">模型名称</span>
              <input className="input" value={model} onChange={(event) => setModel(event.target.value)} />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-900">接口地址</span>
              <input className="input" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
            </label>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={saveConfig} disabled={busy === "save" || !apiKey.trim()}>
                {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存配置
              </button>
              <button className="btn-secondary" onClick={loadStatus} disabled={busy === "status"}>
                {busy === "status" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                读取状态
              </button>
              <button className="btn-secondary" onClick={testConnection} disabled={busy === "test"}>
                {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                测试连通性
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <InfoCard label="当前模型" value={status?.model || model} />
          <InfoCard label="API Key 状态" value={status?.api_key_configured ? "已保存" : "未保存"} />
        </section>

        <section className="panel mt-5 p-5 text-sm">
          <p className="font-medium text-slate-900">当前接口地址</p>
          <p className="mt-2 break-all text-slate-600">{status?.base_url || baseUrl}</p>
        </section>

        {testResult ? (
          <section className={`mt-5 rounded-md border p-4 text-sm ${testResult.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            <p className="font-medium">{testResult.ok ? "连通成功" : "尚未连通"}</p>
            <p className="mt-2">{testResult.message}</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-clinical-900">{value}</p>
    </div>
  );
}
