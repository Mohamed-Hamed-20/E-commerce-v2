export const pagenation = ({ page = 1, size = 4 }) => {
  if (page < 1) page = 1;
  if (size < 1 || size > 20) size = 2;
  const limit = parseInt(size);
  const skip = parseInt((page - 1) * size);
  return { limit, skip };
};
