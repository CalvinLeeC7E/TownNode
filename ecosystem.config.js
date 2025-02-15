module.exports = {
  apps: [
    {
      name: 'town-node',
      script: 'main.js',
      instances: 1,
      exec_mode: 'fork',
      kill_timeout: 10000,
      max_memory_restart: '10240M',
      env: {
        PORT: '80',
        NODE_ENV: 'production',
      },
    },
  ],
};
