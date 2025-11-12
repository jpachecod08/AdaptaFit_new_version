# gunicorn.conf.py
import multiprocessing

# Configuración para optimizar memoria
max_requests = 1000
max_requests_jitter = 50
timeout = 120
workers = 1  # Reduce workers para ahorrar memoria
worker_class = "sync"

# Configuración de memoria
preload_app = True

# Logs
accesslog = "-"
errorlog = "-"
loglevel = "info"