module.exports = {
  apps: [
    {
      name: "vriddhi-backend",
      cwd: "./backend",
      script: "python",
      args: "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2",
      env: {
        NODE_ENV: "production",
        PYTHONUNBUFFERED: "1",
      },
      restart_delay: 3000,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
    },
    {
      name: "vriddhi-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: "vriddhi-scheduler",
      cwd: "./backend",
      script: "python",
      args: "scheduler.py",
      env: {
        PYTHONUNBUFFERED: "1",
      },
      restart_delay: 5000,
      max_restarts: 5,
    },
  ],
};
