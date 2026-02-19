module.exports = {
  apps: [
    {
      name: 'atm',
      script: 'src/bot.js',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
