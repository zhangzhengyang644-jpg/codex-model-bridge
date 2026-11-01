# 上传到 GitHub

此文件夹是公开仓库的准备副本。上传前先自行检查文件、个人信息、源码及依赖许可；它不是自动发布。

1. 登录 GitHub，创建一个新仓库，例如 `codex-deepseek-collab`。选择 Public；为了避免合并冲突，创建时不要自动添加 README、.gitignore 或许可证。
2. 打开 PowerShell，进入此文件夹。下面 `YOUR_NAME` 和 `YOUR_REPO` 换成实际 GitHub 用户名及仓库名：

```powershell
cd 'E:\agent-together\exports\deepseek-collab-github'
git init
git add .
git status
git commit -m "Initial public preview"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

3. 按 Git 提示登录 GitHub；不要把密码或 token 粘贴到 Codex 聊天。上传前的 `git status` 应能看到 `.agents/plugins/marketplace.json`，它是插件市场清单。
4. 打开仓库页面核对 README 和文件是否可见。仓库 README 的 `OWNER/REPO` 和 `REPO` 占位符需要改成真实名称后再提交。

GitHub 可能要求先配置 Git 作者姓名和邮箱；按终端提示使用自己的信息即可。提交到 GitHub 不等于提交 OpenAI 官方插件目录。
