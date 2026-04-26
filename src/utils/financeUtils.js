/**
 * Formats a numeric value into a standard currency string.
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2
    }).format(amount |

| 0);
};

/**
 * Calculates the Equated Monthly Installment (EMI) for loans.
 * @param {number} principal - Total loan amount
 * @param {number} annualRate - Annual interest rate percentage
 * @param {number} months - Duration in months
 */
export const calculateEMI = (principal, annualRate, months) => {
    if (!principal || !months) return 0;
    if (annualRate === 0) return principal / months;

    const r = (annualRate / 100) / 12;
    const n = months;
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return isNaN(emi) ? 0 : emi;
};

/**
 * Simple Base64 encode/decode for local storage obfuscation.
 * Not cryptographically secure against targeted attacks, but fulfills the
 * requirement for a basic client-side passcode implementation.
 */
export const encodeData = (data) => btoa(encodeURIComponent(JSON.stringify(data)));
export const decodeData = (data) => JSON.parse(decodeURIComponent(atob(data)));