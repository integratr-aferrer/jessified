import React from 'react';
import { Card } from './ui/Card';
import { ClipboardPaste } from 'lucide-react';
interface RawInputProps {
  value: string;
  onChange: (value: string) => void;
}
export function RawInput({ value, onChange }: RawInputProps) {
  const placeholder = `2024-01-15 08:02:33 | ID:001 | MATCH:95.2% | IN
2024-01-15 08:05:12 | ID:002 | MATCH:91.8% | IN
2024-01-15 17:01:45 | ID:001 | MATCH:94.1% | OUT
2024-01-15 17:03:22 | ID:002 | MATCH:89.5% | OUT`;
  return (
    <Card
      title="Raw Attendance Data"
      description="Paste the raw output from your Facecheck device below"
      className="h-full">

      <div className="relative">
        <div className="absolute top-3 right-3 pointer-events-none">
          <ClipboardPaste className="h-5 w-5 text-slate-300" />
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-64 p-4 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
          spellCheck={false} />

        <div className="mt-2 text-xs text-slate-500 flex justify-between">
          <span>Format: YYYY-MM-DD HH:MM:SS | ID:XXX | MATCH:XX% | IN/OUT</span>
          <span>{value.split('\n').filter((l) => l.trim()).length} lines</span>
        </div>
      </div>
    </Card>);

}