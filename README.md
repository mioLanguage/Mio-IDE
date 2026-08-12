# Mio-IDE 简介

这是一个专用于Windows（Mac OS和Linux好像也能用）的Mio语言专用IDE

也可以用vscode的[miolanguage](https://marketplace.visualstudio.com/items?itemName=HZY1618yzh.mioforvscode)拓展，配合[Code Runner](https://marketplace.visualstudio.com/items?itemName=formulahendry.code-runner)也可以用

请提前下载好mio3.0编译器，并添加到环境变量的path。不添加也行，在编译命令的mioc前面加上mioc所在目录

由于Mio3.0编译器更新得非常勤，暂时没有自动更新（不然每天消耗你1GB）但如果觉得Mio语言有BUG，就可以更新。如果最新版本也有一样的BUG，可以去[报告bug](https://github.com/mioLanguage/mio/discussions)

[Mio3.0 下载链接](https://github.com/mioLanguage/mio/releases)

[Mio 语法](https://mio.hzy.us.kg/)

# 使用方法

上[node官网](https://nodejs.org/zh-cn/download)安装node，建议下载v24.19.0

进入\Mio-IDE，找到install-deps.bat，运行安装依赖，再找到mio-ide-run.bat，运行便可启动mioIDE，可以给它在桌面弄个快捷方式

如果没有安装依赖，按mio-ide-run.bat、mio-ide-start.vbs都可以安装，mio-ide-start.vbs的话你的电脑不会弹出任何窗口，过1到5分钟才有反应

运行后，不要动新创建的cmd窗口，过一会mio-IDE就会加载出来

如果不想看到cmd窗口，可以双击mio-ide-start.vbs，它会隐藏窗口后台静默启动mio-IDE，启动需要大概1到5秒，期间没有反应是正常的。调试时建议用mio-ide-run.bat，能看到错误信息

# 功能介绍

暂时仅能打开一个文件

窗口右上角有编译、运行、编译运行按钮，按```°＝•```按钮可以设置编译命令和运行命令（不建议改，易改炸）

代码编辑窗口在窗口中间，支持高亮

编译输出在代码编辑窗口下面

左上角可以保存打开文件，编译按钮左侧也可以保存打开文件

编译、运行、编译运行按钮下面，可以调整IDE字号、调整颜色（一坨）、打开或关闭编译输出窗口

可以四处点点，基本只有这些功能了