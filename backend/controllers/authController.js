import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const getSafeUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  avatar: user.avatar || '',
});

const OTP_EXPIRY_MINUTES = 10;
const VERIFIED_WINDOW_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const generateOtp = () => crypto.randomInt(100000, 1000000).toString(); // 6 digits
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');


export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: ['owner', 'staff', 'customer'].includes(role) ? role : 'owner',
      phone: phone || '',
    });

    // ✅ Auto-login on register
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: getSafeUser(user),
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Validate that the stored password is a proper bcrypt hash
    if (typeof existingUser.password !== 'string' || !existingUser.password.startsWith('$2')) {
      console.error(`Invalid password hash for user ${email}:`, existingUser.password);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: getSafeUser(existingUser),
      token: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide email' });
    }

    // Generic response — never reveal whether the email exists
    const genericMessage =
      'If an account with that email exists, a 6-digit code has been sent.';

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordResetOtp +passwordResetOtpExpires +passwordResetOtpAttempts');

    if (!user || !user.isActive) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    // Generate & hash OTP
    const otp = generateOtp();
    user.passwordResetOtp = hashOtp(otp);
    user.passwordResetOtpExpires = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );
    user.passwordResetOtpAttempts = 0;
    user.passwordResetVerifiedUntil = null; // reset any prior verification
    await user.save();

    // Send email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your Password Reset Code',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <h2 style="color:#111827;margin:0 0 8px;">Password Reset Code</h2>
            <p style="color:#374151;">Hi ${user.name || 'there'},</p>
            <p style="color:#374151;">
              Use the code below to reset your AppointSaaS password.
              It expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;background:#eef2ff;color:#4338ca;font-size:32px;font-weight:700;letter-spacing:8px;padding:14px 24px;border-radius:12px;border:1px dashed #c7d2fe;">
                ${otp}
              </div>
            </div>
            <p style="color:#6b7280;font-size:12px;">
              If you didn't request this, you can safely ignore this email.
              Your password won't change unless you complete the reset.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('OTP email send failed:', emailErr.message);
      // Roll back so a failed send doesn't leave a live OTP
      user.passwordResetOtp = null;
      user.passwordResetOtpExpires = null;
      user.passwordResetOtpAttempts = 0;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Could not send code. Try again later.',
      });
    }

    return res.status(200).json({ success: true, message: genericMessage });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ================================================================
// STEP 2 — Verify OTP
// POST /api/auth/verify-otp  { email, otp }
// ================================================================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and OTP are required' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res
        .status(400)
        .json({ success: false, message: 'OTP must be 6 digits' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select(
        '+passwordResetOtp +passwordResetOtpExpires +passwordResetOtpAttempts'
      );

    if (!user || !user.isActive) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired OTP' });
    }

    // No OTP generated or expired
    if (!user.passwordResetOtp || !user.passwordResetOtpExpires) {
      return res
        .status(400)
        .json({ success: false, message: 'No reset request found. Request a new code.' });
    }

    if (user.passwordResetOtpExpires < new Date()) {
      // Clean up
      user.passwordResetOtp = null;
      user.passwordResetOtpExpires = null;
      user.passwordResetOtpAttempts = 0;
      await user.save();
      return res
        .status(400)
        .json({ success: false, message: 'OTP expired. Request a new code.' });
    }

    // Too many wrong attempts
    if (user.passwordResetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      user.passwordResetOtp = null;
      user.passwordResetOtpExpires = null;
      user.passwordResetOtpAttempts = 0;
      await user.save();
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Request a new code.',
      });
    }

    // Compare
    const incomingHash = hashOtp(otp);
    if (incomingHash !== user.passwordResetOtp) {
      user.passwordResetOtpAttempts += 1;
      await user.save();
      const remaining = MAX_OTP_ATTEMPTS - user.passwordResetOtpAttempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`,
      });
    }

    // ✅ OTP correct — open a verified window for step 3
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetVerifiedUntil = new Date(
      Date.now() + VERIFIED_WINDOW_MINUTES * 60 * 1000
    );
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Code verified. You can now set a new password.',
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ================================================================
// STEP 3 — Set new password
// POST /api/auth/reset-password  { email, newPassword }
// ================================================================
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +passwordResetVerifiedUntil');

    if (!user || !user.isActive) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid reset session' });
    }

    // Must have completed OTP verification recently
    if (
      !user.passwordResetVerifiedUntil ||
      user.passwordResetVerifiedUntil < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Verification expired. Please verify a new code.',
      });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear verification window (single-use)
    user.passwordResetVerifiedUntil = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    user.passwordResetOtpAttempts = 0;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in.',
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// export const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body || {};

//     if (
//       typeof currentPassword !== 'string' ||
//       typeof newPassword !== 'string' ||
//       !currentPassword ||
//       !newPassword
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current password and new password are required',
//       });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password must be at least 6 characters',
//       });
//     }

//     const user = await User.findById(req.user?._id).select('+password');
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const passwordMatches = await bcrypt.compare(currentPassword, user.password);
//     if (!passwordMatches) {
//       return res.status(401).json({
//         success: false,
//         message: 'Current password is incorrect',
//       });
//     }

//     user.password = await bcrypt.hash(newPassword, 10);
//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Password changed successfully',
//     });
//   } catch (error) {
//     console.error('Change password error:', error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

export const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};


export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: getSafeUser(req.user),
  });
};