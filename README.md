# OSS 部署

## use

```bash
# 安装
npm install ali-oss-deploy-plush
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
  ENTRY: '', // 项目入口
  PROJECT: '', // 项目名称
  targetDir, // 项目文件夹路径 ps: dist
  maxRetryTimes: 3, // 上传失败重试次数 默认3
  maxConcurrency: 100, // 上传最大并发数 默认100
}
const aliDeploy = new aliOssDeployPlus({
  ossOpts,
  proOpts
})

aliDeploy.start()

```