/**
 * PM2 ecosystem config – run backend + admin on same EC2
 * Usage: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './apps/backend',
      script: 'node',
      args: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'admin',
      cwd: './apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        BACKEND_URL: 'http://127.0.0.1:5000',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        BACKEND_URL: 'http://127.0.0.1:5000',
      },
    },
  ],
};
