const aliOss = require('ali-oss')
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const pLimit = require("p-limit")
const chalk = require('chalk')
const dayjs = require('dayjs')


const log = console.log
const warning = (message) => chalk`{yellow WARNING:} ${message}`
const info = (message) => chalk`{magenta INFO:} ${message}`
const error = (message) => chalk`{red ERROR:} ${message}`
const success = (message) => chalk`{green SUCCESS:} ${message}`

const currTime = () => {
  return dayjs().format("YYYY-MM-DD HH:mm:ss")
}

const divider = (msg) => {
  const str =
    "\n*****************************************************************************************\n"
  if (msg) {
    return console.log(`${str}\n${msg}\n${str}`)
  }
  return console.log(str)
}

class aliOssDeployPlus {
  client = null
  proOpts = {
    maxConcurrency: 100, // 最大并发数
    maxRetryTimes: 3, // 上传失败最多重试次数
    isClean: false, // 是否清除历史文件
    previousDays: 30, // 清除历史文件的天数
  }
  retryTimes = 0 // 上传失败重试次数
  resourceFiles = []
  htmlFiles = []
  ossFiles = []
  currentProjectPath = ''
  promiseLimit = null
  constructor (options) {
    const { ossOpts, proOpts } = options
    this.proOpts = {...this.proOpts, ...proOpts}
    this.currentProjectPath = proOpts.currentProjectPath
    this.init(ossOpts)
    divider(`最大并发数：${this.proOpts.maxConcurrency}`)
    this.promiseLimit = pLimit(this.proOpts.maxConcurrency) // 设置上传最大并发数
  }

  init(opts) {
    if (!opts) {
      throw new error('ali-oss 初始化错误，请提供相关参数')
    }
    this.client = new aliOss({
      internal: true, // oss 内网传输
      ...opts,
    })
  }

  async start () {
    divider(`Node version is: ${process.version}`)
    console.time('耗时')
    if (!this.isExists(this.currentProjectPath)) {
      this.stop(`不存在资源文件路径：${this.currentProjectPath}`)
    }
    this.getResourceFiles(this.proOpts.currentProjectPath).then(res => {
      divider(`资源文件：${this.getFiles().length}\nhtml文件：${this.getFiles('html').length}`)
      this.uploadFiles(this.resourceFiles) // 开始上传资源文件
    }, err => {
      this.stop(err)
    })
  }

  stop (msg) {
    if (msg) {
      divider(error(msg))
    } else {
      divider(error(`抱歉，本次发版失败，请重新发布\n原因：已超过上传失败，最大重试次数 ${chalk.yellow(this.proOpts.maxRetryTimes)} 次\n已终止进程`))
    }
    process.exit(1)
  }

  getFiles (type = 'res', status = 0) {
    const res = this.resourceFiles.filter(item => (item.status === status && item.type === type))
    return res
  }

  setItem (name, val, prop) {
    const index = this.resourceFiles.findIndex(item => item.name === name)
    const i = this.resourceFiles[index]
    this.resourceFiles.splice(index, 1, {
      ...i,
      [prop]: val
    })
  }

  uploadFiles () {
    const resFiles = this.getFiles() // 资源文件列表
    const htmlFiles = this.getFiles('html') // 资源文件列表
    const files = resFiles.length > 0 ? resFiles : htmlFiles
    divider(`开始上传文件 \nfiles::: ${files.length}个`)
    const uploadQueue = []
    files.forEach((i, index) => {
      uploadQueue.push(
        this.promiseLimit(
          () => this.client
          .put(
            `${this.proOpts.projectPath}/${i.name}`,
            `${this.proOpts.currentProjectPath}/${i.name}`
          )
          .then(
            (res) => {
              try {
                console.log(`成功: ${res.name}`)
                this.setItem(i.name, 1, 'status')
                return `${res.name}`;
              } catch (error) {
                log(`失败{res}：${i.name}`)
              }
            },
            (err) => {
              if (this.retryTimes > this.proOpts.maxRetryTimes) {
                this.stop()
              } else {
                divider(`PUT 异常捕获===============${i.name}==========================BEGIN`)
                log(err)
                divider(`PUT 异常捕获===============${i.name}============================END`)
              }
            }
          )
          .finally(() => {
            this.setItem(i.name, ++i.deal, 'deal')
          })
        )
      )
    })

    const p = Promise.all(uploadQueue);
    p.then((res) => {
      divider(`批量上传完成: ${currTime()}`)

      const failedUploadQueue = this.getFiles() // 资源文件上传失败队列
      const htmlFailedUploadQueue = this.getFiles('html') // html文件上传失败队列

      // 上传失败重试逻辑
      if (failedUploadQueue.length) {
        divider('文件上传失败列表：')
        divider(
          [...failedUploadQueue].map((item) => `失败：${item.name}`).join("\n")
        );
        ++this.retryTimes;
        if (this.retryTimes <= this.proOpts.maxRetryTimes) {
          divider(`失败重试 第 ${chalk.yellow(this.retryTimes)} 次`)
          divider()
          this.uploadFiles()
        } else if (this.retryTimes > this.proOpts.maxRetryTimes) {
          this.stop()
        }
      } else if (htmlFailedUploadQueue.length) {
        divider('上传html文件')
        // 延迟1s更新 html文件
        setTimeout(() => {
          this.uploadFiles()
        }, 1000)
      } else {
        divider(success(`当前版本发布成功：${currTime()} \ntotal：${this.resourceFiles.length}`));
        console.timeEnd('耗时')

        //  删除增量部署遗留垃圾文件
        console.time('删除垃圾文件耗时')
        if (this.proOpts.isClean) {
          this.cleanHistoryFiles()
        }
      }
    })
  }

  deleteFiles () {
    log('执行删除动作...')
  }

  cleanHistoryFiles () {
    divider('执行清理历史文件动作...')
    this.getOssFilesByPrefix().then(res => {
      const files = this.ossFiles.filter(item => item.name.includes(this.proOpts.projectPath))
      divider(`共有${files.length}个文件`)
      const deleteQueue = []
      files.forEach(i => {
        const lastModified = new Date(i.lastModified)
        const cutoffTime = new Date().getTime() - (1000 * 60 * 60 * 24) * this.proOpts.previousDays
        if(!fs.existsSync(`${this.proOpts.currentProjectPath}/${i.name.replace(this.proOpts.projectPath, '')}`) && lastModified.getTime() < cutoffTime) {
          log(`当前版本不存在：${i.name} [${lastModified.toLocaleString()}] 文件，准备删除...`)
          deleteQueue.push(
            this.promiseLimit(
              () => this.client.delete(i.name).then(
                (res) => {
                  log(`[删除成功]: ${i.name}`)
                  return `${i.name}`;
                },
                (err) => {
                  log(`[删除失败]：${i.name}`)
                  log(err)
                }
              )
            )
          )
        }
      })
      Promise.all(deleteQueue).then(res => {
        divider(`清理垃圾文件完成：${deleteQueue.length}个文件`)
        console.timeEnd('删除垃圾文件耗时')
      })
    })
  }

  async getOssFilesByPrefix (marker) {
    divider('获取oss文件列表...')
    const result = await this.client.list({
      prefix: this.proOpts.projectPath,
      'max-keys': 1000,
      marker
    })

    this.ossFiles = this.ossFiles.concat(result.objects)
    if (result.isTruncated) {
      await this.getOssFilesByPrefix(result.nextMarker)
    }
  }

  /**
   * 判断项目资源文件路径是否存在
   *
   * @param {*} path
   * @returns
   */
   isExists (path) {
    try {
      return fs.existsSync(path)
    } catch (e) {
      this.stop(e)
    }
    return false
  }

  /**
   * 获取指定目录的资源文件
   *
   * @param {String} dir 指定资源路径
   * @returns 资源文件集合
   */
   getResourceFiles (dir) {
    return new Promise((resolve, reject) => {
      glob(
        "**/*.*",
        {
          cwd: dir,
        },
        (er, files) => {
          if (!er) {
            files.forEach((item) => {
              const itemObj = {
                name: item,
                deal: 0,
                status: 0,
                type: /\.(html|html\.gz)(\?.*)?$/.test(item) ? 'html' : 'res',
              }
              this.resourceFiles.push(itemObj)
            })
            resolve(this.resourceFiles)
          } else {
            reject(er)
          }
        }
      )
    })
  }
}

module.exports = aliOssDeployPlus
