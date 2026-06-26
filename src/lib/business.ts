export interface ParsedBusiness {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description: string;
  balance: number;
  created_at: string;
}

export function parseBusinessName(fullNameStr: string) {
  if (!fullNameStr) return { name: '', category: '', description: '' };
  
  // Since some names could contain "| category: " or other split sequences, we parse them
  const parts = fullNameStr.split(" | category: ");
  if (parts.length > 1) {
    const subParts = parts[1].split(" | description: ");
    return {
      name: parts[0],
      category: subParts[0] || '',
      description: subParts[1] || ''
    };
  }
  return { name: fullNameStr, category: 'General', description: '' };
}

export function serializeBusinessName(name: string, category: string, description: string): string {
  const normName = (name || '').trim();
  const normCat = (category || 'General').trim();
  const normDesc = (description || '').trim();
  
  if (normCat === 'General' && !normDesc) return normName;
  return `${normName} | category: ${normCat} | description: ${normDesc}`;
}

export function parseBusinessTxCategory(categoryStr: string) {
  if (!categoryStr) return { category: '', note: '' };
  const parts = categoryStr.split(" | note: ");
  if (parts.length > 1) {
    return {
      category: parts[0],
      note: parts[1] || ''
    };
  }
  return { category: categoryStr, note: '' };
}

export function serializeBusinessTxCategory(category: string, note: string): string {
  const normCat = (category || '').trim();
  const normNote = (note || '').trim();
  if (!normNote) return normCat;
  return `${normCat} | note: ${normNote}`;
}

