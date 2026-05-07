import os
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_root))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
