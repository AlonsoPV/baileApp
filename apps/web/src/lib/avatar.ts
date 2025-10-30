export const avatarFromName = (name: string, size = 64) => {
  const text = encodeURIComponent((name || '').trim() || 'User');
  return `https://ui-avatars.com/api/?name=${text}&background=1E293B&color=FFFFFF&size=${size}&bold=true&uppercase=true`;
};


