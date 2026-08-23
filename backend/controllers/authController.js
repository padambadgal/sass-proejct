import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";


export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        res.status(201).json({ message: 'User created successfully', user });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

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
            data: {
                id: existingUser._id,
                email: existingUser.email,
                name: existingUser.name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
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
    // req.user is set by the protect middleware
    res.status(200).json({
        success: true,
        data: req.user,
    });
};