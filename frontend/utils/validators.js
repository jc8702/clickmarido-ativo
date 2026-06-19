export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidPhone = (phone) => {
  if (!phone) return true; // se opcional
  // Min 10 digits, opcional +55, ignora espaços e traços
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
};

export const isValidCPFCNPJ = (doc) => {
  if (!doc) return true;
  const digits = doc.replace(/\D/g, '');
  return digits.length >= 11 && digits.length <= 14;
};

export const isValidMoney = (val) => {
  if (val === undefined || val === null) return false;
  const regex = /^\d+(\.\d{1,2})?$/;
  return regex.test(String(val));
};
