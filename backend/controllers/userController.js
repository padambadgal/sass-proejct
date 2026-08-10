import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bycrypt from 'bcryptjs';


export const register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
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

        const hashedPassword = await bycrypt.hash(password, 10);

        if (role !== 'user') {
            return res.status(400).json({ message: 'Invalid role' });
        }

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
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const hashedPassword = await bycrypt.comapre(password, 10);

        if (!hashedPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET);

        res.status(201).json({ message: 'User created successfully', user }); res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                password: user.password,
                token
            },
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}
