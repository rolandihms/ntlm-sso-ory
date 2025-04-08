const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
console.log('Creating directories...');
fs.mkdirSync('./dist/cjs', { recursive: true });
fs.mkdirSync('./dist/esm', { recursive: true });

function runTypeScript(config) {
    console.log(`Running TypeScript with config: ${config}`);
    const result = spawnSync('npx', ['tsc', '--project', config], {
        stdio: 'inherit',
        shell: true,
        encoding: 'utf8'
    });

    if (result.error) {
        console.error(`Error running TypeScript: ${result.error}`);
        process.exit(1);
    }

    if (result.status !== 0) {
        console.error(`TypeScript failed with status: ${result.status}`);
        process.exit(1);
    }

    console.log(`Successfully compiled with ${config}`);
}

console.log('Starting build process...');

// Build CJS version
console.log('\nBuilding CommonJS version...');
runTypeScript('tsconfig.cjs.json');

// Build ESM version
console.log('\nBuilding ESM version...');
runTypeScript('tsconfig.esm.json');

console.log('\nBuild completed successfully!');
