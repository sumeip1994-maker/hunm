# Medical Presentation Studio

中文名：医学学术汇报工作台

面向医生个人用户的 Project-based Web 应用，帮助医生创建学术汇报项目、上传资料、使用 mock AI 生成分析、规划汇报目录，并生成基础 PPTX 文件。第一版不接入真实 AI、文献检索、医学诊断、影像识别或多人协作。

## 技术栈

- 前端：Next.js、TypeScript、Tailwind CSS、App Router
- 后端：FastAPI、SQLAlchemy、SQLite
- PPT 生成：python-pptx
- 文件解析：pypdf、python-docx、python-pptx 基础文本提取
- 部署：Docker Compose，后续可迁移到阿里云 ECS

## 目录结构

```text
medical-presentation-studio/
├── apps/
│   ├── web/          # Next.js + TypeScript 前端
│   └── api/          # FastAPI 后端
├── packages/
│   └── shared/       # 预留共享类型定义
├── data/
│   ├── uploads/      # 本地上传文件
│   └── outputs/      # 生成的PPT文件
├── docker-compose.yml
├── .env.example
└── README.md
```

## 本地开发启动步骤

建议开两个终端分别启动后端和前端。先复制环境变量示例：

```bash
cd medical-presentation-studio
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

## 后端启动命令

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问：

```text
http://localhost:8000/health
```

应返回 `status: ok`。

## 前端启动命令

```bash
cd apps/web
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

## 数据库初始化方式

当前使用 SQLite。后端启动时会自动创建数据表，默认数据库文件位于：

```text
apps/api/medical_presentation.db
```

如需改为 PostgreSQL，可修改 `DATABASE_URL`，例如：

```text
postgresql+psycopg://user:password@host:5432/medical_presentation
```

后续生产环境建议使用阿里云 RDS PostgreSQL。

## 测试与质量检查

后端测试：

```bash
cd apps/api
source .venv/bin/activate
pytest -q
```

前端构建检查：

```bash
cd apps/web
npm run build
```

当前前端脚本使用 webpack 构建，以避免部分受限环境中 Turbopack 需要绑定本地端口导致构建失败。

## 文件上传说明

- 上传接口：`POST /projects/{project_id}/documents`
- 默认最大文件大小：50MB
- 支持格式：pdf、pptx、docx、jpg、png、xlsx
- 文件会保存到 `data/uploads/{project_id}/`
- 服务端会生成安全文件名，并保留 `original_filename`
- 图片和 Excel 第一版只保存，不做 OCR 或结构化解析

## PPT生成说明

- 生成接口：`POST /projects/{project_id}/ppt`
- 下载接口：`GET /projects/{project_id}/ppt/download`
- 文件保存到 `data/outputs`
- 第一版生成 16:9 中文基础 PPTX，包含标题页、目录页、内容页、总结页
- 目录优先读取最新 `outline` Artifact

## Docker Compose启动方式

```bash
cd medical-presentation-studio
docker compose up --build
```

服务地址：

- 前端：`http://localhost:3000`
- 后端：`http://localhost:8000`

第一版 docker-compose 不包含数据库容器，因为使用 SQLite。生产环境建议将 `DATABASE_URL` 切换到 PostgreSQL/RDS，并挂载或迁移历史上传文件到对象存储。

## 阿里云 ECS 部署建议

1. 准备一台 ECS，安装 Docker、Docker Compose、Nginx。
2. 将代码上传到 ECS，配置 `.env`。
3. 使用 `docker compose up -d --build` 启动 web 和 api。
4. Nginx 反向代理：
   - `/` 指向 web 容器 3000
   - `/api` 或独立子域指向 api 容器 8000
5. 配置 HTTPS 证书。
6. 生产数据建议迁移到阿里云 RDS PostgreSQL。
7. 上传文件和生成 PPT 可继续使用 ECS 云盘，后续建议迁移到 OSS。

## 后续接入 DeepSeek/Qwen 的位置

mock Agent 代码位于：

```text
apps/api/app/services/
```

可逐步替换这些服务：

- `AnalysisService`
- `DirectionService`
- `OutlineService`
- `ReviewService`
- `QAService`
- `ScriptService`
- `PPTService`

所有生成结果都会保存为 Artifact，并按同一 type 自动递增 version。接真实模型时建议保留 service 接口不变，只替换内部实现。

## MVP验收流程

1. 创建项目。
2. 进入项目工作区。
3. 上传 pdf、docx、pptx 或图片资料。
4. 在 AI分析 页点击开始分析。
5. 在 汇报规划 页生成方向和目录。
6. 在 PPT生成 页生成 PPT。
7. 点击下载 PPTX。
