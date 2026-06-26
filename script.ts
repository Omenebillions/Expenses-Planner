import * as fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const lines = code.split('\n');
const newLines = [];
let i = 0;
while (i < lines.length) {
    if (lines[i].includes('<span>Upcoming Payments</span>')) {
        newLines.push(lines[i]);
        newLines.push(lines[i+1]);
        newLines.push('                  <Link to="/insights" className="flex items-center gap-4 text-gray-700 font-medium hover:bg-gray-50 p-3 rounded-xl transition-colors" onClick={() => setDrawerOpen(false)}>');
        newLines.push('                     <LineChart size={20} className="text-brand-600" />');
        newLines.push('                     <span>Analysis & Insights</span>');
        newLines.push('                  </Link>');
        i += 2;
        continue;
    }
    newLines.push(lines[i]);
    i++;
}

fs.writeFileSync('src/components/Layout.tsx', newLines.join('\n'));
console.log('done');
