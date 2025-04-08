const fs = require('fs');
const path = require('path');

function listFiles(dir) {
    try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                console.log(`Directory: ${fullPath}`);
                listFiles(fullPath);
            } else {
                console.log(`File: ${fullPath}`);
            }
        });
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }
}

console.log('Project structure:');
listFiles('.');
