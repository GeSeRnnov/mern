const { Router } = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
const User = require('../models/User')
const router = Router()

// api/auth/register
router.post('/register', 
	[
		check('email', 'Incorrect email').isEmail(),
		check('password', 'The minimal length is 6')
			.isLength({ min:6 })
	],	
	async (req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res.status(400).json({
					errors: errors.array(),
					message: 'Incorrect registration data'
				})
			}

			const { email, password} = req.body
			const candidate = await User.findOne({ email })

			if (candidate) {
				return res.status(400).json({ message: 'This user already existed'})
			}

			const hashedPassword = await bcrypt.hash(password, 12)
			const user = new User({ email, password: hashedPassword })

			console.log('!!!auth', user, password)
			await user.save()

			res.status(201).json({ message: 'User has created' })

		} catch(e) {
			res.status(500).json({ message: 'Something went wrong, try again' })
		}
	})

// api/auth/login
router.post('/login', 
	[
		check('email', 'Incorrect email').normalizeEmail().isEmail(),
		check('password', 'Input password').exists()
	],
	async (req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res.status(400).json({
					errors: errors.array(),
					message: 'Incorrect login data'
				})
			}

			const { email, password} = req.body
			const user = await User.findOne({ email })
			if (!user) {
				res.status(400).json({message: 'The user is not exists'})
			}

			const isMatch = await bcrypt.compare(password, user.password)

			if (!isMatch) {
				res.status(400).json({ message: 'Incorrect password, try again.' })
			}

			const token = jwt.sign(
				{userId: user.id},
				config.get('jwtSecret'),
				{ expiresIn: '1h' }
			)

			res.json({ token, userId: user.id })

		} catch(e) {
			re.status(500).json({ message: 'Something went wrong, try again' })
		}
	})

module.exports = router
