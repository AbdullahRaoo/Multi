<?php

namespace App\Console\Commands;

use App\Models\ApiKey;
use Illuminate\Console\Command;

class GenerateApiKey extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api:generate-key {name : A descriptive name for this API key}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a new API key for external applications (like Python camera)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = $this->argument('name');
        
        // Generate the API key
        $key = ApiKey::createWithKey($name);
        
        $this->newLine();
        $this->info('╔════════════════════════════════════════════════════════════════════╗');
        $this->info('║                    API KEY GENERATED SUCCESSFULLY                   ║');
        $this->info('╠════════════════════════════════════════════════════════════════════╣');
        $this->newLine();
        $this->line("  <comment>Name:</comment> {$name}");
        $this->line("  <comment>ID:</comment>   {$key->id}");
        $this->newLine();
        $this->line("  <comment>API Key:</comment>");
        $this->newLine();
        $this->line("  <fg=green>{$key->key}</>");
        $this->newLine();
        $this->info('╠════════════════════════════════════════════════════════════════════╣');
        $this->warn('  ⚠️  IMPORTANT: Copy this key now! It cannot be recovered later.');
        $this->info('╚════════════════════════════════════════════════════════════════════╝');
        $this->newLine();
        
        $this->info('Use this key in your Python code:');
        $this->newLine();
        $this->line('  headers = {"X-API-Key": "' . $key->key . '"}');
        $this->newLine();
        
        return Command::SUCCESS;
    }
}
