# Codex DeepSeek 协作面板（早期版本）

在 Codex 聊天旁展示主 Codex 明确委派给百炼 DeepSeek 的任务和回复。支持连续追问、查看记录和停止请求。Codex 负责检查结果；DeepSeek 不直接读取本地文件或执行命令。

当前版本面向 Windows，默认使用百炼 `deepseek-v4.1-flash-1017`；也可配置兼容 OpenAI Chat Completions 的 HTTPS 服务。不同供应商的兼容程度可能不同。回复完整返回后显示，不支持逐字流式输出。是否能显示侧边面板取决于 Codex 宿主对 MCP App 和 Thread Entrypoint 的支持。

## 使用前

- Windows、支持插件和 MCP App 的 Codex 桌面应用、Git 和 Node.js 24（命令 `node` 需在 PATH 中可用）。
- 自己的阿里云百炼 API Key、模型访问权限和可用额度；请求按百炼的实际计费规则收费。
- 审阅源码和依赖后再安装第三方插件。本项目不是 DeepSeek、阿里云或 OpenAI 的官方产品。

## 安装

打开 PowerShell，进入希望保存项目的位置：

```powershell
git clone https://github.com/zhangzhengyang644-jpg/codex-deepseek-collab.git
cd codex-deepseek-collab
codex plugin marketplace add .
codex plugin add deepseek-collab@local-deepseek-collab
```

在克隆目录中运行下面的脚本，在本机隐藏输入百炼密钥，**不要把密钥发到聊天或提交到 GitHub**：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\plugins\deepseek-collab\setup-key.ps1
```

脚本使用 Windows 当前用户的 DPAPI 加密保存密钥。若覆盖 `DEEPSEEK_COLLAB_STATE`，需另行处理密钥位置；该脚本默认写入 `%LOCALAPPDATA%\deepseek-collab`。

重新打开 Codex 后，可在聊天中说：

> 使用 DeepSeek 协作插件打开面板，暂不调用 API。

面板可用后再明确委派测试：

> 请通过 DeepSeek 协作插件让百炼 DeepSeek 只回复 OK。

第二步会产生 API 请求和可能的费用。每轮将发送当前委派文本及本协作中成功的前序问答，不会自动发送完整主聊天或本地文件。

## 隐私和限制

- 协作任务及模型回复以明文 JSON 保存于 `%LOCALAPPDATA%\deepseek-collab`（或自定义状态目录），请勿将该目录上传或纳入公开仓库。
- 本机密钥可通过环境变量 `DASHSCOPE_API_KEY` 或 DPAPI 文件提供。密钥不要写入此项目文件。
- 取消请求不能撤销已发出的信息或已产生的费用。请求超时为两分钟；意外退出可能留下锁，可新建协作。
- 曾在一个受限环境中出现会话记录重命名失败；重启应用后一次真实百炼单轮调用成功。根因未确认，跨机器安装和逐字流式输出未验证。

## 配置其他供应商（实验性）

当前一次运行只使用一个供应商。修改 `plugins/deepseek-collab/mcp.json`，在 `deepseek-collab` 的 `cwd` 同级添加 `env`；例如 DeepSeek 官方接口：

```json
"env": {
  "COLLAB_ENDPOINT": "https://api.deepseek.com/chat/completions",
  "COLLAB_MODEL": "deepseek-flash"
}
```

上述只填地址和模型名，**不要在 `mcp.json` 或仓库文件中写 API Key**。在克隆目录中配置该供应商的独立密钥：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\plugins\deepseek-collab\setup-key.ps1 -Provider custom -Endpoint 'https://api.deepseek.com/chat/completions'
```

按隐藏提示输入该供应商自己的密钥；不要使用百炼密钥。密钥会绑定到所填地址。更换地址时须重新运行上述脚本并输入新供应商的密钥，再重新安装插件并重启宿主以加载配置。设置环境变量 `COLLAB_API_KEY` 会跳过文件绑定检查，请仅用于可信的进程环境。

使用其他兼容服务时，替换完整的 HTTPS Chat Completions 地址和对应模型名；请先查阅供应商文档。只有兼容 Bearer 认证及本插件请求/响应格式的服务可能可用，原生 Anthropic Messages、OpenAI Responses 等不同协议未实现。设置自定义地址意味着明确同意向该地址发送任务及其协作历史，请仔细核对地址。

自定义供应商尚未进行真实 API 联调；先前真实成功的是百炼默认配置。

## 开发

源码、构建脚本和测试位于 `plugins/deepseek-collab`。已包含构建产物，普通安装不需要重新构建。修改源码后需安装依赖并执行 `pnpm build`；核心测试为 `node --test test.mjs`。重新构建前请审查依赖及其许可证。

## 许可证

本仓库暂未指定源码许可证；公开仓库允许按 GitHub 服务条款查看和 fork，其他许可权利以适用法律和明确授权为准。第三方组件声明见 `THIRD_PARTY_NOTICES.md`；清单包含可能未打入发布产物的依赖。重新分析源码构建所识别的九个打包依赖均有对应许可文本，但尚未核对重新构建产物与当前文件完全一致。
