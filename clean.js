const fs = require('fs');
const path = require('path');

const dirs = ['.next', '.next_temp', '.next_v2'];

dirs.forEach(d => {
    const p = path.join(__dirname, d);
    if (fs.existsSync(p)) {
        try {
            console.log(`Deleting ${p}...`);
            fs.rmSync(p, { recursive: true, force: true });
            console.log(`Deleted ${p}`);
        } catch (e) {
            console.error(`Failed to delete ${p}:`, e.message);
            try {
                const newPath = p + '_trash_' + Date.now();
                console.log(`Renaming to ${newPath}...`);
                fs.renameSync(p, newPath);
                console.log('Renamed successfully.');
            } catch (e2) {
                console.error(`Failed to rename ${p}:`, e2.message);
            }
        }
    } else {
        console.log(`${p} not found.`);
    }
});
