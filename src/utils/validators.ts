export const isAlphabeticOnly = (text: string): boolean => {
  return /^[a-zA-Z\s'-]*$/.test(text);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isLengthValid = (
  text: string,
  min: number,
  max: number,
): boolean => {
  const length = text.trim().length;
  return length >= min && length <= max;
};

export const isEmpty = (text: string): boolean => {
  return text.trim().length === 0;
};

export const hasMinLength = (text: string, min: number): boolean => {
  return text.trim().length >= min;
};

export const hasMaxLength = (text: string, max: number): boolean => {
  return text.trim().length <= max;
};
