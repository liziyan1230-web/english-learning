# Wordloom · 雅思词汇工作台

一个无需后端的个人雅思背词工作台：支持电脑和手机浏览器、间隔复习、单词库管理、学习统计，以及把数据同步至自己的 GitHub 仓库。

## 本地打开

双击 `index.html` 即可试用。朗读功能使用浏览器内置语音；所有学习记录默认保存在当前浏览器中。

## 发布到 GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `ielts-wordloom`。
2. 上传本项目中的 `index.html`、`styles.css`、`app.js` 和 `manifest.webmanifest` 到仓库根目录。
3. 仓库进入 **Settings → Pages**，在 **Build and deployment** 中选择 **Deploy from a branch**，分支选择 `main` 和 `/ (root)`，然后保存。
4. 等待 GitHub 给出站点地址。用手机打开该地址，浏览器菜单中可选择“添加到主屏幕”。

## 在不同设备间同步进度

网站的「同步」页直接读写同一个仓库根目录中的 `wordloom-data.json`。

1. 在 GitHub 的 **Settings → Developer settings → Personal access tokens → Fine-grained tokens** 创建令牌。
2. Repository access 只选择你的词汇仓库；Permissions 中给 **Contents** 选择 **Read and write**。
3. 将仓库名（例如 `你的用户名/ielts-wordloom`）、分支及令牌填写到「同步」页，点击“上传并同步”。
4. 换到另一台设备时，填写相同信息，先点击“从 GitHub 下载”，学习后再“上传并同步”。

令牌不会进入项目文件、GitHub 仓库或浏览器本地存储，仅在当前页面会话中使用。同步前仍建议用“导出”保留一份备份。

## 自定义词库

在「词库」中点击“添加单词”。添加的内容会自动进入学习和间隔复习流程。

