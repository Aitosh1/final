const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const multer = require('multer');
const path = require('path');
const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Укажите директорию для сохранения файлов
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Уникальное имя файла
  }
});

const upload = multer({ storage: storage });

const authMiddleware = (req, res, next ) => {
  const token = req.cookies.token;

  if(!token) {
    // return res.status(401).json( { message: 'Unauthorized'} );
    return res.redirect('/');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch(error) {
    res.status(401).json( { message: 'Unauthorized'} );
  }
}


router.get('/admin', async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }

    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});


router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne( { username } );

    if(!user) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const token = jwt.sign({ userId: user._id}, jwtSecret );
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');

  } catch (error) {
    console.log(error);
  }
});

router.get('/auth/2fa/establish', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }
      const id = req.userId;
      console.log(id);
      const user = await User.findById(id);
      const key = speakeasy.generateSecret({ name: 'portfolio' + user.username });
      user.twofactorKey = key.base32;
      await user.save();
      const qrcode = await QRCode.toDataURL(key.otpauth_url);
      res.render('2fa', { qrcode,locals,layout:adminLayout });
  } catch (error) {
      console.log(error);
      res.status(500).send('Server error');
  }
});
router.post('/auth/2fa/enable',authMiddleware,async(req,res)=>{
  try {
    const id = req.userId;
    const token=req.body.token;
    const user=await User.findById(id);
    const isValid=speakeasy.totp.verify({
      token,
      encoding:'base32',
      secret: user.twofactorKey
    })
    if(!isValid){
      return res.status(400).json({message:'invalid token'})
    }
    user.twofactorEnabled=true;
    await user.save();
  } catch (error) {
    console.log(error);
  }
})

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await Post.find();
    res.render('admin/dashboard', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await Post.find();
    res.render('admin/add-post', {
      locals,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


router.post('/add-post', authMiddleware, upload.array('images', 3), async (req, res) => {
  try {
    const { title, body } = req.body;
    const images = req.files.map(file => '/uploads/' + file.filename); // Получение путей к загруженным файлам

    if (!title || !body || images.length === 0) {
      return res.status(400).send('All fields are required');
    }

    const newPost = new Post({
      title,
      body,
      imagePaths: images,
    });

    await newPost.save();

    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error adding new post');
  }
});

// Маршрут для редактирования поста с изображениями
router.put('/edit-post/:id', authMiddleware, upload.array('images', 3), async (req, res) => {
  try {
    const { title, body } = req.body;
    const images = req.files.map(file => file.path); // Получаем пути к изображениям

    if (!title || !body) {
      return res.status(400).send('All fields are required');
    }

    // Обновляем пост, если изображения были загружены
    await Post.findByIdAndUpdate(req.params.id, {
      title,
      body,
      imagePaths: images.length > 0 ? images : undefined, // Обновляем только если есть изображения
      updatedAt: Date.now()
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error editing post');
  }
});

router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const { title, body, image1, image2, image3 } = req.body;

    // Проверка наличия всех необходимых полей
    if (!title || !body || !image1 || !image2 || !image3) {
      return res.status(400).send('All fields are required');
    }

    // Формирование массива путей к изображениям
    const imagePaths = [image1, image2, image3];

    // Находим пост по ID и обновляем его данные
    await Post.findByIdAndUpdate(req.params.id, {
      title,
      body,
      imagePaths,
      updatedAt: Date.now() // Обновляем дату обновления
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error editing post');
  }
});


router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {

    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    });

    res.redirect(`/edit-post/${req.params.id}`);

  } catch (error) {
    console.log(error);
  }

});
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'amakoken73@gmail.com', 
    pass: process.env.GMAIL_APP_PASSWORD, 
  },
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, age, country, gender } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10); 

    try {
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        age,
        country,
        gender,
      });

  
      const mailOptions = {
        from: 'amakoken73@gmail.com', 
        to: email,
        subject: 'Welcome to our App!',
        text: `Hi ${firstName},

        Thank you for registering with our app!`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).json({ message: 'Internal server error' });
        } else {
          console.log(`Email sent to ${email}`);
          res.status(201).json({ message: 'User Created', user }); // Send user object without password
        }
      });
    } catch (error) {
      if (error.code === 11000) { 
        res.status(409).json({ message: 'Username or email already in use' });
      } else {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router; 

router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

  try {
    await Post.deleteOne( { _id: req.params.id } );
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }

});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});


module.exports = router;