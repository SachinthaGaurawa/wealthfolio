// Advanced password recovery system
// backend/password-recovery.js

import crypto from 'crypto';
import nodemailer from 'nodemailer';

const recoveryMethods = {
  email: {
    sendRecoveryEmail,
    verifyRecoveryToken,
    resetPassword
  },
  sms: {
    sendRecoverySMS,
    verifySMSCode,
    resetPassword
  },
  securityQuestions: {
    verifySecurityQuestions,
    resetPassword
  },
  backupCodes: {
    verifyBackupCode,
    resetPassword
  }
};

// Email recovery
async function sendRecoveryEmail(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    return { success: true, message: 'If an account exists, a recovery email has been sent' };
  }
  
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 3600000; // 1 hour
  
  // Store token securely (hashed)
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  await storeRecoveryToken(user.id, {
    token: hashedToken,
    type: 'email',
    expiresAt: expiry,
    attempts: 0
  });
  
  // Send email with recovery link
  const recoveryLink = `${process.env.APP_URL}/reset-password?token=${token}&id=${user.id}`;
  
  await sendEmail({
    to: email,
    subject: 'WealthFlow - Password Recovery',
    html: generateRecoveryEmailHTML(recoveryLink, user.name)
  });
  
  return { success: true };
}

async function verifyRecoveryToken(userId, token) {
  const stored = await getRecoveryToken(userId);
  
  if (!stored) {
    return { valid: false, message: 'Invalid recovery request' };
  }
  
  if (Date.now() > stored.expiresAt) {
    await deleteRecoveryToken(userId);
    return { valid: false, message: 'Recovery token expired' };
  }
  
  if (stored.attempts >= 5) {
    return { valid: false, message: 'Too many attempts. Please request a new recovery email.' };
  }
  
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  if (hashedToken !== stored.token) {
    await incrementAttempts(userId);
    return { valid: false, message: 'Invalid token' };
  }
  
  return { valid: true };
}

// Security questions recovery
const securityQuestions = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What was your first car?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite movie?",
  "What is your favorite food?",
  "What was your childhood nickname?"
];

async function setupSecurityQuestions(userId, questions, answers) {
  // Store hashed answers
  const hashedAnswers = answers.map(answer => 
    crypto.createHash('sha256').update(answer.toLowerCase().trim()).digest('hex')
  );
  
  await storeSecurityQuestions(userId, {
    questions: questions.map((q, i) => ({ question: q, answerHash: hashedAnswers[i] })),
    setAt: Date.now()
  });
}

async function verifySecurityQuestions(userId, answers) {
  const stored = await getSecurityQuestions(userId);
  
  if (!stored) {
    return { valid: false, message: 'Security questions not set up' };
  }
  
  let correct = 0;
  for (const answer of answers) {
    const hashed = crypto.createHash('sha256').update(answer.toLowerCase().trim()).digest('hex');
    if (stored.questions.some(q => q.answerHash === hashed)) {
      correct++;
    }
  }
  
  // Require at least 3 correct out of chosen questions
  if (correct >= 3) {
    return { valid: true };
  }
  
  return { valid: false, message: 'Incorrect answers' };
}

// Backup codes
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

async function verifyBackupCode(userId, code) {
  const stored = await getBackupCodes(userId);
  
  if (!stored || !stored.codes) {
    return { valid: false, message: 'No backup codes available' };
  }
  
  const codeIndex = stored.codes.findIndex(c => 
    c.code === code.toUpperCase() && !c.used
  );
  
  if (codeIndex === -1) {
    return { valid: false, message: 'Invalid backup code' };
  }
  
  // Mark as used
  stored.codes[codeIndex].used = true;
  stored.codes[codeIndex].usedAt = Date.now();
  
  await storeBackupCodes(userId, stored);
  
  return { valid: true, remaining: stored.codes.filter(c => !c.used).length };
}

// Main password reset function
async function resetPassword(userId, newPassword, method, verification) {
  // Validate password strength
  if (!validatePasswordStrength(newPassword)) {
    throw new Error('Password does not meet security requirements');
  }
  
  // Hash new password
  const hashedPassword = await hashPassword(newPassword);
  
  // Update password
  await updateUserPassword(userId, hashedPassword);
  
  // Invalidate all recovery tokens
  await deleteAllRecoveryTokens(userId);
  
  // Log the password reset
  await logSecurityEvent(userId, 'password_reset', { method });
  
  // Send notification to user's registered email
  await sendPasswordResetNotification(userId);
  
  return { success: true };
}

function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
}
