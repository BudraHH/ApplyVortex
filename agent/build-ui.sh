#!/bin/bash
# Build and deploy UI to agent
# Usage: ./build-ui.sh

set -e

UI_DIR="/home/budrahh/Projects/applyforge/agent-ui-structure-example"
AGENT_DIR="/home/budrahh/Projects/applyforge/agent"

echo "🔨 Building React UI..."
cd "$UI_DIR"
npm run build

echo "📦 Copying to agent..."
rm -rf "$AGENT_DIR/ui"
cp -r dist "$AGENT_DIR/ui"

echo "✅ UI updated! Restart the agent to see changes."
echo ""
echo "To restart: cd $AGENT_DIR && python main.py"
