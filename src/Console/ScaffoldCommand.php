<?php

namespace Jwan\DashboardKit\Console;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ScaffoldCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'dashboard:scaffold
        {--port= : Override the auto-selected port (5173-5199)}
        {--no-open : Do not auto-open the browser}
        {--standalone : Run the wizard without writing to the host project (ZIP download only)}';

    /**
     * The console command description.
     */
    protected $description = 'Open the interactive dashboard scaffolding wizard in your browser.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $packageRoot = $this->resolvePackageRoot();
        $wizardPath = $packageRoot . DIRECTORY_SEPARATOR . 'wizard';

        if (! is_dir($wizardPath)) {
            $this->error("Wizard directory not found at: {$wizardPath}");
            $this->line('Did you run `composer install` and `npm install` inside the package?');

            return self::FAILURE;
        }

        $port = (int) ($this->option('port') ?: $this->pickFreePort(5173, 5199));

        if ($port <= 0) {
            $this->error('Could not find a free port in range 5173-5199.');

            return self::FAILURE;
        }

        $url = "http://localhost:{$port}";
        $standalone = (bool) $this->option('standalone');
        // The host project root is the directory the user invoked Artisan from.
        // Vite middleware writes generated files into THIS directory.
        $hostCwd = getcwd();

        $this->newLine();
        $this->info('  dashboard-kit — scaffolding wizard');
        $this->line("  Wizard:  {$url}");
        if ($standalone) {
            $this->line('  Mode:    standalone (ZIP download only)');
        } else {
            $this->line("  Project: {$hostCwd}");
            $this->line('  Mode:    host write (files go directly into this project)');
        }
        $this->line('  Press Ctrl+C to stop.');
        $this->newLine();

        if (! $this->option('no-open')) {
            $this->openBrowser($url);
        }

        // Boot Vite dev server for the wizard app.
        // We run with cwd = host project so the Vite middleware writes there.
        // Standalone mode sets DASHBOARD_KIT_STANDALONE=1 which makes the
        // middleware refuse to write — wizard falls back to ZIP.
        $env = array_merge(
            $_ENV,
            $_SERVER,
            [
                'DASHBOARD_KIT_STANDALONE' => $standalone ? '1' : '0',
                // Vite needs to be launched inside wizard/ (so npm finds package.json),
                // but the middleware writes to the HOST project — pass that explicitly.
                'DASHBOARD_KIT_HOST_CWD' => $standalone ? '' : $hostCwd,
            ]
        );

        $process = new Process(
            ['npm', 'run', 'dev', '--', '--port', (string) $port, '--host', '127.0.0.1'],
            $wizardPath,
            $env,
            null,
            null
        );

        $process->setTty(Process::isTtySupported());

        try {
            $process->run(function ($type, $buffer) {
                $this->output->write($buffer);
            });
        } catch (\Throwable $e) {
            $this->error('Failed to start the wizard dev server: ' . $e->getMessage());

            return self::FAILURE;
        }

        return $process->getExitCode() ?? self::SUCCESS;
    }

    /**
     * Walk up from this file to the package root (where composer.json lives).
     */
    protected function resolvePackageRoot(): string
    {
        return dirname(__DIR__, 2);
    }

    /**
     * Scan the given inclusive port range and return the first port that is free.
     * Returns 0 if none found.
     */
    protected function pickFreePort(int $from, int $to): int
    {
        for ($port = $from; $port <= $to; $port++) {
            $socket = @stream_socket_server(
                "tcp://127.0.0.1:{$port}",
                $errno,
                $errstr
            );

            if ($socket !== false) {
                fclose($socket);

                return $port;
            }
        }

        return 0;
    }

    /**
     * Open the user's default browser. Cross-platform.
     */
    protected function openBrowser(string $url): void
    {
        $cmd = match (PHP_OS_FAMILY) {
            'Darwin' => ['open', $url],
            'Windows' => ['cmd', '/c', 'start', '', $url],
            default => ['xdg-open', $url],
        };

        try {
            (new Process($cmd))->setTimeout(5)->run();
        } catch (\Throwable) {
            // Best-effort — user can click the printed URL manually.
        }
    }
}