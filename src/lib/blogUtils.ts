export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export const extractTOC = (htmlContent: string): TOCItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h2, h3');
  return Array.from(headings).map((heading, index) => ({
    id: `heading-${index}`,
    text: heading.textContent || '',
    level: parseInt(heading.tagName[1]),
  }));
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
