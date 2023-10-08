const express = require('express')
const bodyparser = require('body-parser')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')
const { stat } = require('fs')

const app = express()
app.use(bodyparser.json())
app.use(cors())

// const db = knex({
//   client: 'pg',
//   connection: {
//     host: '127.0.0.1',
//     user: 'postgres',
//     password: 'Wiggles123',
//     database: 'e-store'
//   }
// });

const db = {
        items: [
            {   
                id: 0,
                image: 'https://hnsfpau.imgix.net/5/images/detailed/165/18569AU.1.jpg?fit=fill&bg=0FFF&w=785&h=441&auto=format,compress',
                name: 'Kettle',
                category: 'newArrivals',
                description: 'Electric kettle.',
                price: '$40.00',
                reviews: [
                    {
                        stars: [true, true, true, true, true],
                        review: 'this is pretty good'
                    },
                    {
                        stars: [true, true, false, false, false],
                        review: 'this sucks'
                    }
                ]
            },
            {   
                id: 1,
                image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/peripherals/input-devices/dell/keyboards/aw420k/media-gallery/keyboard-aw420k-xkb-05-bk-gallery-01.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=1389&qlt=100,1&resMode=sharp2&size=1389,402&chrss=full',
                name: 'Keyboard',
                category: 'bestSellers',
                description: 'Keyboard with LEDs',
                price: '$70.00',
                reviews: [
                    {
                        stars: [true, true, true, true, true],
                        review: 'this is pretty good'
                    },
                    {
                        stars: [true, true, false, false, false],
                        review: 'this sucks'
                    }
                ]
            },
            {   
                id: 2,
                image: 'https://m.media-amazon.com/images/I/51GWerTmfPL._AC_SX679_.jpg',
                name: 'Spider-Man Mask',
                category: 'topRated',
                description: 'Keyboard with LEDs',
                price: '$60.00',
                reviews: [
                    {
                        stars: [true, true, true, true, true],
                        review: 'this is pretty good'
                    },
                    {
                        stars: [true, true, false, false, false],
                        review: 'this sucks'
                    }
                ]
            },
        ],
    
}

app.get('/', (req,res) => {
    res.json('it is working!')
})


app.post('/signin', (req, res) => {
    const {email, password} = req.body
    if(!email || !password) {
        res.status(400).json('incorrect form submission')
    }
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash)
        if(isValid) {
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong cridentials')
        }        
    })
    .catch(err =>  res.status(400).json('wrong cridentials'))
})

app.post('/register', (req, res) => {
    const {firstName, lastName, email, phone, street1, street2, city, country, state, zip, password} = req.body
    if(!email || !firstName || !lastName || !password) {
        res.status(400).json('incorrect form submission')
    }
    const hash = bcrypt.hashSync(password)
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
                .returning('*')
                .insert({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    email: loginEmail[0].email,
                    street1: street1,
                    street2: street2,
                    city: city,
                    country: country,
                    state: state,
                    zip: zip
                })
                .then(user => {
                    res.json(user[0])
                })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.get('/items', (req, res) => {
    res.json(db.items[0])
})

app.put('/add_items', (req, res) => {
    const { item } = req.body

    db.items.push(item)
    res.json(db.items)
})

app.listen(3000, () => {
    console.log('app is running')
})