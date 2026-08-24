# Convenience wrapper for running this fork's local daemon from source.
# Run `make` to see commands.

BUN := mise exec --
PORT ?= 4788
CLI := bun run apps/cli/src/main.ts

.PHONY: help run stop open build install uninstall
.DEFAULT_GOAL := help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} \
		/^[$$()% a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } \
		/^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Dev

run: ## Run foreground daemon from source, live-reload UI
	$(BUN) env EXECUTOR_DEV=1 $(CLI) daemon run --foreground --port $(PORT)

stop: ## Stop the executor daemon
	@$(BUN) $(CLI) daemon stop

open: ## Open the web UI, already signed in
	$(BUN) $(CLI) open

##@ Daemon

build: ## Compile self-contained executor binary
	cd apps/cli && $(BUN) bun run build

install: build ## Install always-on launchd daemon
	$(BUN) apps/cli/dist/executor-darwin-arm64/bin/executor daemon service install --port $(PORT)

uninstall: ## Stop and remove the launchd daemon
	$(BUN) apps/cli/dist/executor-darwin-arm64/bin/executor daemon service uninstall
