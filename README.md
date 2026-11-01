# Codex Model Bridge

在 Codex 聊天旁展示委派给其他模型的任务和回复。主 Codex 可以继续追问并核查结果。协作模型不能直接执行本地命令或读取本地文件。

当前为 Windows 早期版本，每次运行连接一个支持 OpenAI Chat Completions 格式和 Bearer 认证的 HTTPS 供应商。**新安装不预设供应商或模型**；须由使用者自行配置。不是所有供应商都兼容，也不支持逐字流式输出。

## 安装和配置

需要 Windows、支持插件和 MCP App 的 Codex、Git、Node.js 24，以及所选供应商的 API Key、模型权限和额度。服务调用可能产生费用。

1. 克隆仓库：

```powershell
git clone https://github.com/zhangzhengyang644-jpg/codex-deepseek-collab.git
cd codex-deepseek-collab
```

2. 编辑 `plugins/deepseek-collab/mcp.json`，在 `cwd` 同级加入 `env`。以下是 DeepSeek 官方接口示例，其他供应商须替换成其完整的 HTTPS Chat Completions 地址和模型名称：

```json
"env": {
  "COLLAB_ENDPOINT": "https://api.deepseek.com/chat/completions",
  "COLLAB_MODEL": "deepseek-flash"
}
```

3. 在仓库目录运行下列脚本，地址与上一步保持一致。在隐藏提示中输入**该供应商的**密钥，不要发到聊天或写入 GitHub：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\plugins\deepseek-collab\setup-key.ps1 -Provider custom -Endpoint 'https://api.deepseek.com/chat/completions'
```

4. 安装并重启 Codex：

```powershell
codex plugin marketplace add .
codex plugin add deepseek-collab@local-deepseek-collab
```

5. 请求打开模型协作面板；明确委派后才发送任务。更换供应商须修改配置、为新地址重新输入其密钥、重新安装并重启。**不要在配置文件中填写密钥。** 当前没有面板内供应商切换功能。

## 隐私与兼容

- 发送的是明确委派的文本和当前协作中成功的前序问答；使用者应核对供应商地址，发送后无法撤回。切换地址不能复用其他供应商的协作历史。
- 密钥使用当前 Windows 用户的 DPAPI 加密，保存在 `%LOCALAPPDATA%\deepseek-collab` 并绑定到配置地址。协作记录在该目录明文保存，切勿上传。
- `COLLAB_API_KEY` 环境变量是高级用法，会跳过地址绑定检查；仅在可信环境下使用。不要将任何密钥写入项目文件或公开仓库。
- 为兼容旧版本，内部插件、工具及存储目录仍保留 `deepseek-collab` 标识。仅旧百炼安装可显式设置 `COLLAB_PROVIDER=bailian` 继续使用原有密钥与模型；新安装无默认供应商。
- 与原生 Anthropic Messages、OpenAI Responses 等不同协议不兼容。实际可用模型、认证和价格请以供应商文档为准。Codex 宿主必须支持 MCP App 和 Thread Entrypoint。
- 旧版已验证一次百炼真实调用；通用接口和本版桌面界面尚未完成其他供应商真实联调。曾出现本地会话记录重命名失败，根因尚未确认。

## 开发和许可

源码和测试位于 `plugins/deepseek-collab`。本仓库未指定源码许可证；查看和 fork 按 GitHub 条款执行，其他权利以适用法律和明确授权为准。第三方许可见 `THIRD_PARTY_NOTICES.md`。
