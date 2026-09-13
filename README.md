# AI 面试教练

一个面向具体求职面试的跨平台桌面准备工具。

当前版本支持 PDF、DOCX、Markdown、TXT 格式的简历与职位描述上传，也可以直接粘贴文本；应用会生成岗位简报，完成带可选语音输入的自适应模拟面试，并输出逐题复盘、重试对比和可打印报告。简历、职位描述与面试记录仅保存在本机；实时公司调研、云端模型和语音播报尚未接入。

## Development

Prerequisites: Node.js, pnpm, Rust through rustup, and the platform requirements documented by Tauri 2.

```sh
pnpm install
pnpm dev
pnpm tauri dev
```

## Quality checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo test --manifest-path src-tauri/Cargo.toml
```

Product requirements are in [`PRD.md`](PRD.md), architecture direction is in [`docs/architecture.md`](docs/architecture.md), and active implementation plans are under [`docs/plans/`](docs/plans/).

# Hawaii Travelling Plan

一个面向双人夏威夷旅行的中文规划网站。可以按岛屿和玩法浏览景点、查看景点详情、选择想去的地方，并生成包含跨岛交通、每日主题、驾车估算、购票提示和候补点位的旅行计划。

## 本地运行

```bash
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:1420/`。默认 Vite 端口被占用时，请以终端显示的实际地址为准。

## 验证

```bash
pnpm typecheck
pnpm test
pnpm build
```

## 数据与来源

- 景点数据与详情内容位于 `src/data/`。
- 图片授权与归属信息位于 `public/places/attribution-*.json`。
- 最终计划页位于 `public/generated-plan/`，其上游许可与第三方声明请见该目录中的 `LICENSE` 和 `THIRD_PARTY_NOTICES.md`。

## 规划器边界

当前版本使用可解释的确定性规划器。行驶时间为地理分区估算，不代表实时路况；预约、开放时间、天气和海洋状况需在出发前通过官方渠道再次确认。
