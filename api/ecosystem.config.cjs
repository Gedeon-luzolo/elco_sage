// Fichier de configuration PM2 - En .cjs car le package api est en "type": "module"
module.exports = {
  apps: [
    {
      name: "elco-sage-api",
      script: "dist/main.js",
      // Nest lit le .env du dossier courant
      cwd: "/var/www/elco_sage/api",
      env: {
        // Doit être posé avant le démarrage de Node pour que les dates soient à l'heure de Kinshasa
        TZ: "Africa/Kinshasa",
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
