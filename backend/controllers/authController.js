import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

        // ⚠️ IMPORTANT: Always return 200 even if the email doesn't exist.
        // Otherwise attackers can enumerate registered emails.
        const genericMessage =
            'If an account with that email exists, a password reset link has been sent.';

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user || !user.isActive) {
            return res.status(200).json({ success: true, message: genericMessage });
        }

        // Generate raw token (only sent to the user, never stored)
        const rawToken = crypto.randomBytes(32).toString('hex');

        // Store SHA-256 hash of the token + expiry
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');

        // Valid for 15 minutes
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

        await user.save();

        // Build reset URL (frontend page)
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

        // Send email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: user.email,
                subject: 'Password Reset Request',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111827;">Reset your password</h2>
            <p style="color:#374151;">Hi ${user.name || 'there'},</p>
            <p style="color:#374151;">
              We received a request to reset the password for your AppointSaaS account.
              Click the button below to choose a new password. This link expires in <strong>15 minutes</strong>.
            </p>
            <p style="text-align:center; margin: 32px 0;">
              <a href="${resetUrl}"
                 style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
                Reset Password
              </a>
            </p>
            <p style="color:#6b7280; font-size:12px;">
              If the button doesn't work, paste this URL into your browser:<br/>
              <span style="word-break:break-all;">${resetUrl}</span>
            </p>
            <p style="color:#6b7280; font-size:12px;">
              If you didn't request this, you can safely ignore this email.
              Your password won't change until you create a new one.
            </p>
          </div>
        `,
            });
        } catch (emailErr) {
            // Log but don't reveal to the client
            console.error('Reset email send failed:', emailErr.message);

            // Roll back the token so a failed send doesn't leave a live token
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            await user.save();

            return res
                .status(500)
                .json({ success: false, message: 'Could not send reset email. Try again later.' });
        }

        return res.status(200).json({
            success: true,
            message: genericMessage,
        });
    } catch (error) {
        console.error('forgotPassword error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ================================================================
// STEP 2 — Consume the token and set a new password
// POST /api/auth/reset-password/:token  { newPassword }
// ================================================================
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        // Hash incoming token and look up the user with a matching, unexpired token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }, // not expired
            isActive: true,
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token',
            });
        }

        // Set new password
        user.password = await bcrypt.hash(newPassword, 10);

        // Invalidate token (single-use)
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

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