export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export const extractTOC = (htmlContent: string): TOCItem[] => {
  const items: TOCItem[] = [];
  const regex = /<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h[23]>/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = regex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10);
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    items.push({ id: `heading-${index}`, text, level });
    index += 1;
  }
  return items;
};

export const addHeadingIds = (htmlContent: string): string => {
  let index = 0;
  return htmlContent.replace(/<h([23])>(.*?)<\/h[23]>/g, (_match, level, text) => {
    const id = `heading-${index++}`;
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};
