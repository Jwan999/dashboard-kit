<?php

namespace Jwan\DashboardKit;

use Illuminate\Support\ServiceProvider;
use Jwan\DashboardKit\Console\ScaffoldCommand;

class DashboardKitServiceProvider extends ServiceProvider
{
    /**
     * Register package services.
     */
    public function register(): void
    {
        // Phase 2/3: bind config emitter, token generator, etc.
    }

    /**
     * Bootstrap package services.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                ScaffoldCommand::class,
            ]);
        }
    }
}