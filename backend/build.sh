#!/usr/bin/env bash
set -o errexit

echo "==> Python: $(python --version 2>&1)"

pip install --upgrade pip
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate