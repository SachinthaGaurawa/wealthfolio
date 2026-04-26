export const calculateLoan = (amount, interest, months) => {
  const monthlyRate = interest / 100 / 12;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
};

export const daysLeft = (endDate) => {
  const diff = new Date(endDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const isWarning = (days) => days <= 10;
