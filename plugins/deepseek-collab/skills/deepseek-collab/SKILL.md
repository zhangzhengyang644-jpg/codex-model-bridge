---
name: deepseek-collab
description: 用户明确要求调用百炼 DeepSeek、让 DeepSeek 协作或打开其对话侧边面板时使用。不是原生 spawn_agent，不自动委派。
---

先说明使用本技能。调用 deepseek_panel 打开/建立协作记录，保留返回的 session_id。
仅用户明确要求 DeepSeek 工作时，调用 deepseek_delegate，提供 session_id 与自包含任务 brief。不要把整个主对话或未经授权的文件上传给第三方。
同一任务后续追问复用 session_id；独立任务新建 session。返回结果后主 Codex 核验、整合并给用户答复。
子模型无本地文件或命令工具，不把文字建议当作已执行操作；不要预设代码审查、写论文等分工。
可使用 deepseek_history 查看任务与回复、deepseek_cancel 停止当前请求。面板展示的是委派记录，不是主聊天全文副本。
若没有密钥，让用户运行插件目录内 setup-key.ps1，在本机隐藏输入；严禁让用户通过聊天或工具参数传入密钥。
这是 MCP 工具桥接，父会话仍用原 OpenAI 登录。不要调用同名原生子智能体替代本工具。
