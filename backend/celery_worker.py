import os
os.environ.setdefault('FORKED_BY_MULTIPROCESSING', '1')

from app.tasks import app as celery_app

__all__ = ('celery_app',)

# This ensures that the 'FORKED_BY_MULTIPROCESSING' environment variable is set
# before any multiprocessing operations are initiated by Celery workers.