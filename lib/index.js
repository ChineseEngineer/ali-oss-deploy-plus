const aliOss = require('ali-oss')
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const pLimit = require("p-limit")
const chalk = require('chalk')
const dayjs = require('dayjs')


const log = console.log
const warning = (message) => chalk`{yellow WARNING:} ${message}`;
const info = (message) => chalk`{magenta INFO:} ${message}`;
const error = (message) => chalk`{red ERROR:} ${message}`;
const success = (message) => chalk`{green SUCCESS:} ${message}`;

const currTime = () => {
  return dayjs().format("YYYY-MM-DD HH:mm:ss");
}

const divider = (msg) => {
  const str =
    "\n*****************************************************************************************\n";
  if (msg) {
    return console.log(`${str}\n${msg}\n${str}`);
  }
  return console.log(str);
}


var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var aliOssDeployPlus = /** @class */ (function () {
    function aliOssDeployPlus(options) {
        this.client = null;
        this.proOpts = {
            maxConcurrency: 100,
            maxRetryTimes: 3,
        };
        this.retryTimes = 0; // 上传失败重试次数
        this.resourceFiles = [];
        this.htmlFiles = [];
        this.targetDir = null;
        this.promiseLimit = null;
        var ossOpts = options.ossOpts, proOpts = options.proOpts;
        this.proOpts = __assign({}, this.proOpts, proOpts);
        this.targetDir = proOpts.targetDir;
        this.init(ossOpts);
        log("\u6700\u5927\u5E76\u53D1\u6570\uFF1A" + this.proOpts.maxConcurrency);
        this.promiseLimit = pLimit(this.proOpts.maxConcurrency); // 设置上传最大并发数
    }
    aliOssDeployPlus.prototype.init = function (opts) {
        if (!opts) {
            throw new error('ali-oss 初始化错误，请提供相关参数');
        }
        this.client = new aliOss(__assign({ internal: true }, opts));
    };
    aliOssDeployPlus.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                console.time('耗时');
                if (!this.isExists(this.targetDir)) {
                    throw new Error("\u4E0D\u5B58\u5728\u8D44\u6E90\u6587\u4EF6\u8DEF\u5F84\uFF1A" + this.targetDir);
                }
                this.getResourceFiles(this.proOpts.targetDir).then(function (res) {
                    divider("\u8D44\u6E90\u6587\u4EF6\uFF1A" + _this.getFiles().length + "\nhtml\u6587\u4EF6\uFF1A" + _this.getFiles('html').length);
                    _this.uploadFiles(_this.resourceFiles); // 开始上传资源文件
                }, function (err) {
                    log(error(err));
                });
                return [2 /*return*/];
            });
        });
    };
    aliOssDeployPlus.prototype.stop = function () {
        divider(error("\u62B1\u6B49\uFF0C\u672C\u6B21\u53D1\u7248\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u53D1\u5E03\n\u539F\u56E0\uFF1A\u5DF2\u8D85\u8FC7\u4E0A\u4F20\u5931\u8D25\uFF0C\u6700\u5927\u91CD\u8BD5\u6B21\u6570 " + chalk.yellow(this.proOpts.maxRetryTimes) + " \u6B21\n\u5DF2\u7EC8\u6B62\u8FDB\u7A0B"));
        process.exit(1);
    };
    aliOssDeployPlus.prototype.getFiles = function (type, status) {
        if (type === void 0) { type = 'res'; }
        if (status === void 0) { status = 0; }
        var res = this.resourceFiles.filter(function (item) { return (item.status === status && item.type === type); });
        return res;
    };
    aliOssDeployPlus.prototype.setItem = function (name, val, prop) {
        var _a;
        var index = this.resourceFiles.findIndex(function (item) { return item.name === name; });
        var i = this.resourceFiles[index];
        this.resourceFiles.splice(index, 1, __assign({}, i, (_a = {}, _a[prop] = val, _a)));
    };
    aliOssDeployPlus.prototype.uploadFiles = function () {
        var _this = this;
        var resFiles = this.getFiles(); // 资源文件列表
        var htmlFiles = this.getFiles('html'); // 资源文件列表
        var files = resFiles.length > 0 ? resFiles : htmlFiles;
        divider("\u5F00\u59CB\u4E0A\u4F20\u6587\u4EF6 \nfiles::: " + files.length + "\u4E2A");
        var uploadQueue = [];
        var projectPath = this.proOpts.PROJECT
            ? this.proOpts.ENTRY + "/" + this.proOpts.PROJECT + "/" + i.name
            : this.proOpts.ENTRY + "/" + i.name;
        files.forEach(function (i, index) {
            uploadQueue.push(_this.promiseLimit(function () { return _this.client
                .put(projectPath, _this.proOpts.targetDir + "/" + i.name)
                .then(function (res) {
                try {
                    console.log("\u6210\u529F: " + res.name);
                    _this.setItem(i.name, 1, 'status');
                    return "" + res.name;
                }
                catch (error) {
                    log("\u5931\u8D25{res}\uFF1A" + i.name);
                }
            }, function (err) {
                if (_this.retryTimes > _this.proOpts.maxRetryTimes) {
                    _this.stop();
                }
                else {
                    divider("PUT \u5F02\u5E38\u6355\u83B7===============" + i.name + "==========================BEGIN");
                    log(err);
                    divider("PUT \u5F02\u5E38\u6355\u83B7===============" + i.name + "============================END");
                }
            })
                .finally(function () {
                _this.setItem(i.name, ++i.deal, 'deal');
            }); }));
        });
        var p = Promise.all(uploadQueue);
        p.then(function (res) {
            divider("\u6279\u91CF\u4E0A\u4F20\u5B8C\u6210: " + currTime());
            var failedUploadQueue = _this.getFiles(); // 资源文件上传失败队列
            var htmlFailedUploadQueue = _this.getFiles('html'); // html文件上传失败队列
            // 上传失败重试逻辑
            if (failedUploadQueue.length) {
                divider('文件上传失败列表：');
                divider(failedUploadQueue.slice().map(function (item) { return "\u5931\u8D25\uFF1A" + item.name; }).join("\n"));
                ++_this.retryTimes;
                if (_this.retryTimes <= _this.proOpts.maxRetryTimes) {
                    divider("\u5931\u8D25\u91CD\u8BD5 \u7B2C " + chalk.yellow(_this.retryTimes) + " \u6B21");
                    divider();
                    _this.uploadFiles();
                }
                else if (_this.retryTimes > _this.proOpts.maxRetryTimes) {
                    _this.stop();
                }
            }
            else if (htmlFailedUploadQueue.length) {
                divider('上传html文件');
                // 延迟2s更新 html文件
                setTimeout(function () {
                    _this.uploadFiles();
                }, 2000);
            }
            else {
                divider(success("\u5F53\u524D\u7248\u672C\u53D1\u5E03\u6210\u529F\uFF1A" + currTime() + " \ntotal\uFF1A" + _this.resourceFiles.length));
                console.timeEnd('耗时');
            }
        });
    };
    aliOssDeployPlus.prototype.deleteFiles = function () {
        log('执行删除动作...');
    };
    /**
     * 判断项目资源文件路径是否存在
     *
     * @param {*} path
     * @returns
     */
    aliOssDeployPlus.prototype.isExists = function (path) {
        try {
            return fs.existsSync(path);
        }
        catch (e) {
            log(e);
            // console.log(error(e.message))
        }
        return false;
    };
    /**
     * 获取指定目录的资源文件
     *
     * @param {String} dir 指定资源路径
     * @returns 资源文件集合
     */
    aliOssDeployPlus.prototype.getResourceFiles = function (dir) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            glob("**/*.*", {
                cwd: dir,
            }, function (er, files) {
                if (!er) {
                    files.forEach(function (item) {
                        var itemObj = {
                            name: item,
                            deal: 0,
                            status: 0,
                            type: /\.(html|html\.gz)(\?.*)?$/.test(item) ? 'html' : 'res',
                        };
                        _this.resourceFiles.push(itemObj);
                    });
                    resolve(_this.resourceFiles);
                }
                else {
                    reject(er);
                }
            });
        });
    };
    return aliOssDeployPlus;
}());
module.exports = aliOssDeployPlus;
