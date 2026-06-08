"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, PlugZap, Save, Sparkles } from "lucide-react";

import { api } from "@/lib/api/client";
import type { LLMProvider, LLMStatus, LLMTestResult } from "@/types";

const fallbackProviders: Record<string, LLMProvider> = {
  bailian: {
    label: "阿里云百炼",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    default_model: "qwen-plus",
    models: ["qwen3.7-plus", "qwen-plus", "qwen-max", "qwen-turbo", "qwen-long"],
  },
  bailian_coding: {
    label: "阿里云百炼 Coding Plan",
    base_url: "https://coding.dashscope.aliyuncs.com/v1",
    default_model: "qwen3.7-plus",
    models: ["qwen3.7-plus", "qwen3.6-plus", "kimi-k2.5", "glm-5", "MiniMax-M2.5", "qwen3.5-plus", "qwen3-max-2026-01-23", "qwen3-coder-next", "qwen3-coder-plus", "glm-4.7"],
  },
  deepseek: {
    label: "DeepSeek",
    base_url: "https://api.deepseek.com",
    default_model: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  volcengine: {
    label: "火山方舟",
    base_url: "https://ark.cn-beijing.volces.com/api/v3",
    default_model: "doubao-seed-1-6",
    models: ["doubao-seed-1-6", "doubao-seed-1-6-thinking", "deepseek-v3", "deepseek-r1"],
  },
  volcengine_coding: {
    label: "火山方舟 Coding Plan",
    base_url: "https://ark.cn-beijing.volces.com/api/coding/v3",
    default_model: "ark-code-latest",
    models: ["ark-code-latest", "doubao-seed-code", "doubao-seed-2.0-code", "deepseek-v3.2", "kimi-k2.5", "glm-4.7"],
  },
};

export default function ModelIntegrationPage() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("bailian");
  const [model, setModel] = useState("qwen-plus");
  const [baseUrl, setBaseUrl] = useState("https://dashscope.aliyuncs.com/compatible-mode/v1");
  const [status, setStatus] = useState<LLMStatus | null>(null);
  const [testResult, setTestResult] = useState<LLMTestResult | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [showKey, setShowKey] = useState(false);

  const providers = status?.providers || fallbackProviders;
  const selectedProvider = providers[provider] || fallbackProviders.bailian;
  const canSave = Boolean(apiKey.trim() || status?.api_key_configured);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setBusy("status");
    setError("");
    try {
      const data = await api.getLLMStatus();
      setStatus(data);
      setProvider(data.provider || "bailian");
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
      const nextProvider = apiKey.trim().startsWith("sk-sp-") && provider === "bailian" ? "bailian_coding" : provider;
      const nextProviderConfig = providers[nextProvider] || fallbackProviders.bailian;
      const nextModel = nextProvider === provider ? model : nextProviderConfig.default_model;
      const data = await api.saveLLMConfig({ api_key: apiKey, provider: nextProvider, model: nextModel, base_url: nextProviderConfig.base_url });
      setStatus(data);
      setProvider(data.provider || nextProvider);
      setModel(data.model || nextModel);
      setBaseUrl(data.base_url || nextProviderConfig.base_url);
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

  function chooseProvider(nextProvider: string) {
    const config = providers[nextProvider] || fallbackProviders.bailian;
    setProvider(nextProvider);
    setModel(config.default_model);
    setBaseUrl(config.base_url);
    setTestResult(null);
    setSaved("");
    setError("");
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
            <p className="mt-3 text-slate-600">选择国内大模型通道，输入对应 API Key 后即可保存并测试连接。</p>
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
              <span className="font-medium text-slate-900">模型通道</span>
              <select className="input" value={provider} onChange={(event) => chooseProvider(event.target.value)}>
                {Object.entries(providers).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-900">{selectedProvider.label} API Key</span>
              <div className="flex gap-2">
                <input className="input" type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-..." autoComplete="off" />
                <button className="btn-secondary aspect-square px-2" type="button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "隐藏 API Key" : "显示 API Key"}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-900">模型名称</span>
              <select className="input" value={model} onChange={(event) => setModel(event.target.value)}>
                {selectedProvider.models.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-900">接口地址</span>
              <input className="input bg-slate-50" value={baseUrl} readOnly />
            </label>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={saveConfig} disabled={busy === "save" || !canSave}>
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
          <InfoCard label="当前通道" value={status?.provider_label || selectedProvider.label} />
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
            <p className="mt-2 break-all">通道：{selectedProvider.label} / 模型：{testResult.model}</p>
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
