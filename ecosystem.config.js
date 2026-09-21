// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'antdv-next-server', // 应用名称
      script: './dist/src/index.js',   // 生产环境入口文件（假设编译后为 dist/index.js）
      // 根据 CPU 核心数自动启动多个实例，充分利用多核性能
      instances: 'max',
      exec_mode: 'cluster', // 开启集群模式，实现负载均衡[reference:1]

      // 开发环境配置
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      // 生产环境配置
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },

      // 日志配置
      output: './logs/out.log',   // 标准输出日志文件[reference:2]
      error: './logs/error.log',  // 错误日志文件
      merge_logs: true,           // 集群模式下合并所有实例的日志[reference:3]
      log_date_format: 'YYYY-MM-DD HH:mm:ss', // 日志时间格式[reference:4]

      // 高级配置
      max_memory_restart: '500M', // 内存超过 500M 时自动重启[reference:5]
      watch: false,               // 生产环境关闭监听
      autorestart: true,          // 应用崩溃时自动重启
      // 优雅关闭，给应用留出处理剩余请求的时间[reference:6]
      kill_timeout: 5000,
    },
    { name: "worker", script: "./dist/worker.js", instances: 2 },
  ],
};