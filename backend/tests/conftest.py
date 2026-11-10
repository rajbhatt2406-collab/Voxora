"""
conftest.py — session-scoped fixtures for Voxora backend tests.

Changes working directory to c:\\Voxora\\backend before any test so that
relative paths in config (CHROMA_DB_PATH=./chroma_db, DATABASE_URL=./voxora.db)
resolve correctly and the app can be imported cleanly.
"""
import os
import sys
import pytest

# Set working dir to backend so relative env paths resolve correctly
# conftest.py is at: c:\Voxora\backend\tests\conftest.py
# dirname(__file__)      -> c:\Voxora\backend\tests
# dirname(dirname(...))  -> c:\Voxora\backend
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(BACKEND_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
