module.exports = {
  apps: [
    {
      name: "elearning",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      cwd: "./",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    }
  ]
};
