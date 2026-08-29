module.exports = {
  apps: [
    {
      name: "elearning",
      script: "server.js",
      cwd: "/www/wwwroot/elearning",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    }
  ]
};
