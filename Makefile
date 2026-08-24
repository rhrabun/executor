# Convenience wrapper for running this fork's local daemon from source.
# Data lives in ~/.executor (the upstream default location).

BUN := mise exec --
PORT ?= 4788
DATA_DIR ?= $(HOME)/.executor
CLI := bun run apps/cli/src/main.ts

.PHONY: run stop open token

run:
	$(BUN) env EXECUTOR_DEV=1 EXECUTOR_DATA_DIR=$(DATA_DIR) $(CLI) daemon run --foreground --port $(PORT)

stop:
	@pids=$$($(BUN) lsof -ti tcp:$(PORT) 2>/dev/null || lsof -ti tcp:$(PORT)); \
	if [ -n "$$pids" ]; then kill $$pids && echo "stopped: $$(echo $$pids | tr '\n' ' ')"; \
	else echo "nothing listening on $(PORT)"; fi

open:
	$(BUN) env EXECUTOR_DATA_DIR=$(DATA_DIR) $(CLI) open

token:
	@python3 -c "import json,os;print(json.load(open(os.path.expanduser('$(DATA_DIR)/server-control/auth.json')))['token'])"
