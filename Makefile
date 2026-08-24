# Convenience wrapper for running this fork's local daemon from source.
# Data lives in ~/.executor (the upstream default location).

BUN := mise exec --
PORT ?= 4788
CLI := bun run apps/cli/src/main.ts

.PHONY: run stop open

# EXECUTOR_DEV=1 serves the UI from vite with live reload — no dist build
# needed after pulling new upstream commits.
run:
	$(BUN) env EXECUTOR_DEV=1 $(CLI) daemon run --foreground --port $(PORT)

stop:
	@pids=$$($(BUN) lsof -ti tcp:$(PORT) 2>/dev/null || lsof -ti tcp:$(PORT)); \
	if [ -n "$$pids" ]; then kill $$pids && echo "stopped: $$(echo $$pids | tr '\n' ' ')"; \
	else echo "nothing listening on $(PORT)"; fi

open:
	$(BUN) $(CLI) open
