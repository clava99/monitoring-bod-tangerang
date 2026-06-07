#!/bin/bash
set -e
pnpm install --frozen-lockfile
pip install -r <(python3 -c "
import tomllib
with open('pyproject.toml', 'rb') as f:
    data = tomllib.load(f)
for dep in data['project']['dependencies']:
    print(dep)
") --quiet
