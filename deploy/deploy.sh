#!/bin/bash

# The Compose files are addressed relative to the repository root, so the script
# has to run from there regardless of the directory it was invoked from.
cd "$(dirname "$0")/.." || exit 1

echo "=========================================="
echo "  Stopping existing containers..."
echo "=========================================="
docker compose down

echo
echo "=========================================="
echo "  Select run mode:"
echo "=========================================="
echo "1 - Development"
echo "2 - Production"
echo "3 - Exit"
echo
read -p "Enter mode number: " mode

case "$mode" in
  1)
    echo
    echo "=========================================="
    echo "  Starting DEV environment"
    echo "=========================================="
    docker compose -f compose.yaml -f deploy/compose.dev.yml up --build -d
    ;;
  2)
    echo
    echo "=========================================="
    echo "  Starting PROD environment"
    echo "=========================================="
    docker compose -f compose.yaml -f deploy/compose.prod.yml up --build -d
    ;;
  3)
    echo "Done!"
    exit 0
    ;;
  *)
    echo "Invalid input. Exiting..."
    exit 1
    ;;
esac