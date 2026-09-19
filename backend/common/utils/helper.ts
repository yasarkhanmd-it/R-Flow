export const sanitizeUser = (user: any) => {
  if (!user) return null;
  const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete userObj.password;
  return userObj;
};
