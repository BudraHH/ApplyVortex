#!/bin/bash
export PYWEBVIEW_GUI=qt
source venv/bin/activate
python main.py "$@"
