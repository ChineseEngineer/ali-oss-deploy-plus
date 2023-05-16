# 前端项目部署到 OSS

## Usage

```bash
# 安装
npm install ali-oss-deploy-plus
```

```js
// 使用
const aliOssDeployPlus = require('ali-oss-deploy-plus')

const ossOpts = {
  bucket: '', // 桶名称
  region: '', // 区域
  accessKeyId: '', // AK
  accessKeySecret: '', // AS
  internal: true, // 默认内网传输
}
const proOpts = {
  projectPath: '', // oss 存放项目的路径
  currentProjectPath: '', // 当前发布项目的文件夹路径 ps: dist
  maxRetryTimes: 3, // 上传失败重试次数 默认 3
  maxConcurrency: 100, // 上传最大并发数 默认 100
}
const aliDeploy = new aliOssDeployPlus({
  ossOpts,
  proOpts
})

aliDeploy.start()

```